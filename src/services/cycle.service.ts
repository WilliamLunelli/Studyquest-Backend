import { studyCycleRepository } from "../repositories/study-cycle.repository";
import {
  CompleteCycleResponse,
  CreateCycleBlockInput,
  CreateCycleResponse,
  CycleAlignmentItem,
  CycleAlignmentResponse,
  CycleBlockResponse,
  UpdateCycleBlockInput,
} from "../types/cycle.types";
import { AppError } from "../utils/app-error";
import { fatiarEmBlocos, intercalarBlocos } from "../utils/cycle";
import { checkOnboardingStatus } from "./user.service";

export async function createCycle(
  userId: string,
): Promise<CreateCycleResponse> {
  const onboardingCompleto = await checkOnboardingStatus(userId);

  if (!onboardingCompleto) {
    throw new AppError(409, "Complete o onboarding antes de gerar o ciclo.");
  }

  const userData = await studyCycleRepository.getCycleGenerationData(userId);

  if (!userData || !userData.goal) {
    throw new AppError(409, "Complete o onboarding antes de gerar o ciclo.");
  }

  const totalMinutosSemana = userData.availabilities.reduce((total, item) => {
    return total + item.minutos;
  }, 0);

  const scores = userData.goal.weights.flatMap((weight) => {
    return weight.area.subjects.map((subject) => {
      const diffculty = userData.difficulties.find((item) => {
        return item.subjectId === subject.id;
      });

      const dificuldade = diffculty?.dificuldade ?? 3;

      const score = weight.peso * (1 + (dificuldade - 3) * 0.15);

      return {
        subjectId: subject.id,
        materia: subject.nome,
        peso: weight.peso,
        dificuldade,
        score,
        topics: subject.topics,
      };
    });
  });

  const totalScores = scores.reduce((total, item) => {
    return total + item.score;
  }, 0);

  const scoreComMinutos = scores.map((item) => {
    // TODO garantir que a dificuldade nao faca uma materia de peso menor receber mais tempo que uma de peso maior.
    const proporcao = item.score / totalScores;
    const minutos = Math.round(totalMinutosSemana * proporcao);

    return {
      ...item,
      proporcao,
      minutos,
    };
  });

  let blocks: CreateCycleBlockInput[] = [];
  let ordemValue = 1;

  scoreComMinutos.forEach((item) => {
    const duracoes = fatiarEmBlocos(item.minutos);

    duracoes.forEach((duracao, index) => {
      // TODO usar apenas assuntos ainda nao concluidos da materia, exceto quando for bloco de revisao.
      const topic = item.topics[index % item.topics.length];
      blocks.push({
        ordem: ordemValue,
        duracao,
        subjectId: item.subjectId,
        topicId: topic?.id ?? null,
      });

      ordemValue++;
    });
  });

  const blocosIntercalados = intercalarBlocos(blocks);

  const cycle = await studyCycleRepository.createCycleWithBlocks(
    userId,
    blocosIntercalados,
  );

  return {
    id: cycle.id,
    geradoEm: cycle.createdAt,
    posicaoAtual: cycle.posicaoAtual,
    blocos: cycle.blocks.map((block) => {
      return {
        id: block.id,
        ordem: block.ordem,
        subjectId: block.subjectId,
        materia: block.subject.nome,
        topicId: block.topicId,
        assunto: block.topic?.nome ?? null,
        duracaoMin: block.duracao,
        status: block.status === "CONCLUIDO" ? "concluido" : "pendente",
      };
    }),
  };
}

export async function getCurrentCycle(
  userId: string,
): Promise<CreateCycleResponse> {
  const cycle = await studyCycleRepository.getCycleActive(userId);

  if (!cycle) {
    throw new AppError(409, "Nenhum ciclo ativo encontrado.");
  }

  return {
    id: cycle.id,
    geradoEm: cycle.createdAt,
    posicaoAtual: cycle.posicaoAtual,
    blocos: cycle.blocks.map((block) => {
      return {
        id: block.id,
        ordem: block.ordem,
        subjectId: block.subject.id,
        materia: block.subject.nome,
        topicId: block.topic?.id ?? null,
        assunto: block.topic?.nome ?? null,
        duracaoMin: block.duracao,
        status: block.status === "CONCLUIDO" ? "concluido" : "pendente",
      };
    }),
  };
}

export async function updateBlock(
  userId: string,
  blockId: string,
  data: UpdateCycleBlockInput,
): Promise<CycleBlockResponse> {
  const updatedBlock = await studyCycleRepository.updateBlock(
    userId,
    blockId,
    data,
  );

  if (!updatedBlock) {
    throw new AppError(404, "Bloco de ciclo não encontrado.");
  }

  return {
    id: updatedBlock.id,
    ordem: updatedBlock.ordem,
    subjectId: updatedBlock.subject.id,
    materia: updatedBlock.subject.nome,
    topicId: updatedBlock.topic?.id ?? null,
    assunto: updatedBlock.topic?.nome ?? null,
    duracaoMin: updatedBlock.duracao,
    status: updatedBlock.status === "CONCLUIDO" ? "concluido" : "pendente",
  };
}

export async function completeBlock(
  userId: string,
  blockId: string,
): Promise<CompleteCycleResponse> {
  // TODO validar conclusao e XP dentro da mesma transaction para evitar duas requisicoes concederem XP ao mesmo tempo.
  let xpGanho: number = 200;

  const isConcluido = await studyCycleRepository.getBlockById(blockId);

  if (!isConcluido) {
    throw new AppError(409, "Bloco não encontrado.");
  }

  if (isConcluido.status === "CONCLUIDO") {
    xpGanho = 0;
  }

  const bloco = await studyCycleRepository.completeBlock(
    userId,
    blockId,
    xpGanho,
  );

  if (!bloco) {
    throw new AppError(404, "Bloco do ciclo não encontrado.");
  }

  return {
    bloco: {
      id: bloco.id,
      ordem: bloco.ordem,
      subjectId: bloco.subject.id,
      materia: bloco.subject.nome,
      topicId: bloco.topic?.id ?? null,
      assunto: bloco.topic?.nome ?? null,
      duracaoMin: bloco.duracao,
      // TODO manter o status exatamente como a API espera: "pendente" ou "concluido", sem acento.
      status: bloco.status === "CONCLUIDO" ? "concluído" : "pendente",
    },
    xpGanho,
  };
}

export async function getCycleAlignment(
  userId: string,
): Promise<CycleAlignmentResponse> {
  const onboardingCompleto = await checkOnboardingStatus(userId);

  if (!onboardingCompleto) {
    throw new AppError(
      409,
      "Complete o onboarding antes de consultar o alinhamento.",
    );
  }

  const userData = await studyCycleRepository.getCycleGenerationData(userId);

  if (!userData || !userData.goal) {
    throw new AppError(
      409,
      "Complete o onboarding antes de consultar o alinhamento.",
    );
  }

  const totalMinutosSemana = userData.availabilities.reduce((total, item) => {
    return total + item.minutos;
  }, 0);

  const scores = userData.goal.weights.flatMap((weight) => {
    return weight.area.subjects.map((subject) => {
      const difficulty = userData.difficulties.find((item) => {
        return item.subjectId === subject.id;
      });

      const dificuldade = difficulty?.dificuldade ?? 3;

      const score = weight.peso * (1 + (dificuldade - 3) * 0.15);

      return {
        subjectId: subject.id,
        materia: subject.nome,
        peso: weight.peso,
        score,
      };
    });
  });

  const totalScores = scores.reduce((total, item) => {
    return total + item.score;
  }, 0);

  const minutosReais =
    await studyCycleRepository.getFinishedMinutesBySubject(userId);

  const minutosReaisPorMateria = new Map(
    minutosReais.map((item) => {
      return [item.subjectId, item._sum.minutosAcumulados ?? 0];
    }),
  );

  return scores.map((item) => {
    const minutosIdeaisSemana = Math.round(
      totalMinutosSemana * (item.score / totalScores),
    );

    const minutosReaisSemana = minutosReaisPorMateria.get(item.subjectId) ?? 0;

    const desvioPercentual =
      minutosIdeaisSemana === 0
        ? 0
        : Math.round((minutosReaisSemana / minutosIdeaisSemana) * 100);

    const status =
      minutosReaisSemana < minutosIdeaisSemana * 0.7
        ? "abaixo"
        : minutosReaisSemana > minutosIdeaisSemana * 1.3
          ? "acima"
          : "ok";

    return {
      subjectId: item.subjectId,
      materia: item.materia,
      peso: item.peso,
      minutosIdeaisSemana,
      minutosReaisSemana,
      desvioPercentual,
      status,
    };
  });
}
