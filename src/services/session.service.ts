import { sessionRepository } from "../repositories/session.repository";
import { avaliarStreakRetroativo } from "./gamification.service";
import { SelfRating, SessionPreset } from "../generated/prisma/enums";
import {
  ActiveSessionResponse,
  CreateSessionInput,
  FinishSessionInput,
  FinishSessionResponse,
  PauseResumeResponse,
  SessionResponse,
} from "../types/session.types";
import { AppError } from "../utils/app-error";
import { calculateAccumulatedMinutes } from "../utils/session.utils";

function toSessionResponse(session: {
  id: string;
  startedAt: Date;
  duracaoAlvoMin: number | null;
  preset: SessionPreset;
  type: string;
  status: string;
}): SessionResponse {
  return {
    id: session.id,
    startedAt: session.startedAt,
    duracaoAlvoMin: session.duracaoAlvoMin,
    preset: session.preset,
    tipo: session.type as SessionResponse["tipo"],
    status: session.status as SessionResponse["status"],
  };
}

export async function startSession(
  userId: string,
  input: CreateSessionInput,
): Promise<SessionResponse> {
  const activeSession = await sessionRepository.findActiveByUserId(userId);

  if (activeSession) {
    throw new AppError(
      409,
      "Você já tem uma sessão em andamento ou pausada. Finalize-a antes de iniciar outra.",
    );
  }

  const subject = await sessionRepository.findSubjectById(input.subjectId);

  if (!subject) {
    throw new AppError(404, "Matéria não encontrada.");
  }

  const topic = await sessionRepository.findTopicById(input.topicId);

  if (!topic) {
    throw new AppError(404, "Assunto não encontrado.");
  }

  // Validation (SessionPreset x duracaoAlvoMin) already enforced 25/50 for
  // the fixed presets; LIVRE ignores whatever came in the body and stores
  // null (module rule — no other module reads this value, it's just metadata).
  const targetDurationMin =
    input.preset === SessionPreset.LIVRE ? null : input.duracaoAlvoMin!;

  const session = await sessionRepository.create(userId, input, targetDurationMin);

  return toSessionResponse(session);
}

export async function getActiveSession(
  userId: string,
): Promise<ActiveSessionResponse | null> {
  const session = await sessionRepository.findActiveByUserId(userId);

  if (!session) {
    return null;
  }

  return {
    ...toSessionResponse(session),
    minutosAcumulados: calculateAccumulatedMinutes(session),
  };
}

async function findOwnedSessionOrThrow(userId: string, sessionId: string) {
  const session = await sessionRepository.findById(sessionId);

  if (!session) {
    throw new AppError(404, "Sessão não encontrada.");
  }

  if (session.userId !== userId) {
    throw new AppError(403, "Esta sessão pertence a outro usuário.");
  }

  return session;
}

export async function pauseSession(
  userId: string,
  sessionId: string,
): Promise<PauseResumeResponse> {
  const session = await findOwnedSessionOrThrow(userId, sessionId);

  if (session.status !== "RUNNING") {
    throw new AppError(409, "Só é possível pausar uma sessão em andamento.");
  }

  const accumulatedMinutes = calculateAccumulatedMinutes(session);
  const updated = await sessionRepository.pause(sessionId, accumulatedMinutes);

  return {
    id: updated.id,
    status: updated.status,
    minutosAcumulados: updated.minutosAcumulados,
  };
}

export async function resumeSession(
  userId: string,
  sessionId: string,
): Promise<PauseResumeResponse> {
  const session = await findOwnedSessionOrThrow(userId, sessionId);

  if (session.status !== "PAUSED") {
    throw new AppError(409, "Só é possível retomar uma sessão pausada.");
  }

  const updated = await sessionRepository.resume(sessionId);

  return {
    id: updated.id,
    status: updated.status,
    minutosAcumulados: updated.minutosAcumulados,
  };
}

export async function finishSession(
  userId: string,
  sessionId: string,
  input: FinishSessionInput,
): Promise<FinishSessionResponse> {
  if (!input.autoavaliacao) {
    throw new AppError(422, "A autoavaliacao e obrigatoria.");
  }

  // Quita qualquer lacuna de dias passados (com escudo ou zerando o
  // streak) ANTES do finish decidir o resultado de hoje — em uma
  // transação própria, já commitada quando finishWithEffects abre a
  // dela. Ordem importa: precisa rodar enquanto esta sessão ainda não
  // virou FINISHED (ver comentário em
  // session.repository.ts::findLastStudiedDay).
  const resultadoStreakRetroativo = await avaliarStreakRetroativo(
    userId,
    new Date(),
    sessionId,
  );

  const result = await sessionRepository.finishWithEffects(userId, sessionId, {
    selfRating: SELF_RATING_MAP[input.autoavaliacao],
    notes: input.nota,
  });

  if (result === "NOT_FOUND") {
    throw new AppError(404, "Sessao nao encontrada.");
  }

  if (result === "FORBIDDEN") {
    throw new AppError(403, "Esta sessao pertence a outro usuario.");
  }

  if (result === "INVALID_STATUS") {
    throw new AppError(
      409,
      "So e possivel encerrar uma sessao em andamento ou pausada.",
    );
  }

  return {
    sessao: {
      id: result.sessao.id,
      minutosTotais: result.sessao.minutosAcumulados,
      tipo: result.sessao.type,
      finishedAt: result.sessao.finishedAt!,
    },
    xp: result.xp,
    streak: {
      ...result.streak,
      escudoUsado: resultadoStreakRetroativo.escudosConsumidos > 0,
    },
    proximaRevisao: result.proximaRevisao,
    proximoBloco: result.proximoBloco,
  };
}

const SELF_RATING_MAP: Record<FinishSessionInput["autoavaliacao"], SelfRating> =
  {
    travei: SelfRating.TRAVEI,
    ok: SelfRating.OK,
    tranquilo: SelfRating.TRANQUILO,
  };
