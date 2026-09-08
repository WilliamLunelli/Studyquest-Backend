import prisma from "../config/database";
import {
  AMOSTRA_MINIMA_ACERTO,
  MINIMO_AUTOAVALIACOES_TRANQUILO,
} from "../utils/dashboard.utils";

export const dashboardRepository = {
  getUserGoalId(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { goalId: true, streakAtual: true, streakRecorde: true },
    });
  },

  countTopicsForGoal(goalId: string) {
    return prisma.topic.count({
      where: { subject: { area: { goalWeights: { some: { goalId } } } } },
    });
  },

  // Restrito aos assuntos do objetivo atual (mesmo escopo de
  // countTopicsForGoal) — sem isso, trocar de objetivo poderia inflar
  // a cobertura com assuntos de um objetivo antigo que não fazem mais
  // parte do denominador.
  async countDistinctTopicsSeenForGoal(userId: string, goalId: string) {
    const grupos = await prisma.studySession.groupBy({
      by: ["topicId"],
      where: {
        userId,
        status: "FINISHED",
        topicId: { not: null },
        topic: { subject: { area: { goalWeights: { some: { goalId } } } } },
      },
    });

    return grupos.length;
  },

  // Piso de amostra (>=10 questões) já aplicado no banco via `having` —
  // evita trazer assuntos com amostra irrelevante só pra descartar depois.
  getQuestionLogTopicAggregates(userId: string, start: Date, end: Date) {
    return prisma.questionLog.groupBy({
      by: ["topicId"],
      where: {
        userId,
        data: { gte: start, lt: end },
      },
      _sum: {
        feitas: true,
        acertadas: true,
      },
      having: {
        feitas: { _sum: { gte: AMOSTRA_MINIMA_ACERTO } },
      },
    });
  },

  // Piso de 3 autoavaliações TRANQUILO já aplicado via `having`, pelo
  // mesmo motivo do método acima.
  getTranquiloCountsByTopic(userId: string, start: Date, end: Date) {
    return prisma.studySession.groupBy({
      by: ["topicId"],
      where: {
        userId,
        status: "FINISHED",
        selfRating: "TRANQUILO",
        topicId: { not: null },
        finishedAt: { gte: start, lt: end },
      },
      _count: {
        topicId: true,
      },
      having: {
        topicId: { _count: { gte: MINIMO_AUTOAVALIACOES_TRANQUILO } },
      },
    });
  },

  // Linha a linha (não agregado): usado só pra decidir revisaoAntecipada,
  // que depende do percentual de CADA registro individual (a regra real
  // de antecipação, em question-log.service.ts, olha log a log — não a
  // média do período). Chamado só para os poucos topicIds já filtrados
  // por excessoConfianca, nunca para o histórico inteiro do usuário.
  getQuestionLogRowsForTopics(
    userId: string,
    topicIds: string[],
    start: Date,
    end: Date,
  ) {
    if (topicIds.length === 0) {
      return Promise.resolve([]);
    }

    return prisma.questionLog.findMany({
      where: {
        userId,
        topicId: { in: topicIds },
        data: { gte: start, lt: end },
      },
      select: {
        topicId: true,
        feitas: true,
        acertadas: true,
      },
    });
  },

  getTopicNames(topicIds: string[]) {
    if (topicIds.length === 0) {
      return Promise.resolve([]);
    }

    return prisma.topic.findMany({
      where: { id: { in: topicIds } },
      select: {
        id: true,
        nome: true,
        subject: {
          select: { nome: true },
        },
      },
    });
  },

  getActiveCycleBlockDurations(userId: string) {
    return prisma.studyCycle.findFirst({
      where: { userId, ativo: true },
      select: {
        createdAt: true,
        blocks: {
          select: { duracao: true },
        },
      },
    });
  },

  countFinishedBlockSessions(userId: string, start: Date, end: Date) {
    return prisma.studySession.count({
      where: {
        userId,
        status: "FINISHED",
        cycleBlockId: { not: null },
        finishedAt: { gte: start, lt: end },
      },
    });
  },

  getWeeklyAvailabilityMinutes(userId: string) {
    return prisma.userAvailability.aggregate({
      where: { userId },
      _sum: { minutos: true },
    });
  },
};
