import { studyCycleRepository } from "../repositories/study-cycle.repository";
import { completedTopicRepository } from "../repositories/completed-topic.repository";
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
import {
  DIFICULDADE_NEUTRA,
  ajustarScoresSemInverterPesos,
  calcularScoreMateria,
  classificarAderencia,
} from "../utils/cycle-score.utils";
import { calcularBonusAssuntoConcluido } from "../utils/xp.utils";
import { concederBonusAssuntoConcluido } from "./gamification.service";
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

      const dificuldade = diffculty?.dificuldade ?? DIFICULDADE_NEUTRA;

      const score = calcularScoreMateria(weight.peso, dificuldade);

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

  const scoreAjustadoPorMateria = ajustarScoresSemInverterPesos(scores);

  const totalScoresAjustados = scores.reduce((total, item) => {
    return total + (scoreAjustadoPorMateria.get(item.subjectId) ?? item.score);
  }, 0);

  const scoreComMinutos = scores.map((item) => {
    const scoreAjustado =
      scoreAjustadoPorMateria.get(item.subjectId) ?? item.score;
    const proporcao = scoreAjustado / totalScoresAjustados;
    const minutos = Math.round(totalMinutosSemana * proporcao);

    return {
      ...item,
      proporcao,
      minutos,
    };
  });

  const completedTopicIds = new Set(
    (await completedTopicRepository.listTopicIdsByUser(userId)).map((item) => {
      return item.topicId;
    }),
  );

  let blocks: CreateCycleBlockInput[] = [];
  let ordemValue = 1;

  scoreComMinutos.forEach((item) => {
    const duracoes = fatiarEmBlocos(item.minutos);
    const pendingTopics = item.topics.filter((topic) => {
      return !completedTopicIds.has(topic.id);
    });

    if (pendingTopics.length === 0) {
      return;
    }

    duracoes.forEach((duracao, index) => {
      const topic = pendingTopics[index % pendingTopics.length];
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

  if (blocosIntercalados.length === 0) {
    throw new AppError(409, "Nenhum assunto pendente disponivel para gerar o ciclo.");
  }

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

  if (updatedBlock === "INVALID_TOPIC") {
    throw new AppError(422, "O assunto informado nao pertence a materia escolhida.");
  }

  if (updatedBlock === null) {
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
  const bloco = await studyCycleRepository.findOwnedBlockWithTopic(userId, blockId);

  if (!bloco) {
    throw new AppError(404, "Bloco do ciclo não encontrado.");
  }

  if (!bloco.topicId) {
    throw new AppError(422, "Este bloco não tem assunto associado para concluir.");
  }

  const jaConcluido = await completedTopicRepository.findByUserAndTopic(
    userId,
    bloco.topicId,
  );

  let xpGanho = 0;

  if (!jaConcluido) {
    await completedTopicRepository.create(userId, bloco.topicId);
    await concederBonusAssuntoConcluido(userId);
    xpGanho = calcularBonusAssuntoConcluido();
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

      const dificuldade = difficulty?.dificuldade ?? DIFICULDADE_NEUTRA;

      const score = calcularScoreMateria(weight.peso, dificuldade);

      return {
        subjectId: subject.id,
        materia: subject.nome,
        peso: weight.peso,
        score,
      };
    });
  });

  const scoreAjustadoPorMateria = ajustarScoresSemInverterPesos(scores);

  const totalScores = scores.reduce((total, item) => {
    return total + (scoreAjustadoPorMateria.get(item.subjectId) ?? item.score);
  }, 0);

  const minutosReais =
    await studyCycleRepository.getFinishedMinutesBySubject(userId);

  const minutosReaisPorMateria = new Map(
    minutosReais.map((item) => {
      return [item.subjectId, item._sum.minutosAcumulados ?? 0];
    }),
  );

  return scores.map((item) => {
    const scoreAjustado =
      scoreAjustadoPorMateria.get(item.subjectId) ?? item.score;

    const minutosIdeaisSemana = Math.round(
      totalMinutosSemana * (scoreAjustado / totalScores),
    );

    const minutosReaisSemana = minutosReaisPorMateria.get(item.subjectId) ?? 0;

    const desvioPercentual =
      minutosIdeaisSemana === 0
        ? 0
        : Math.round((minutosReaisSemana / minutosIdeaisSemana) * 100);

    const status = classificarAderencia(minutosIdeaisSemana, minutosReaisSemana);

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
