import prisma from "../config/database";
import {
  CreateQuestionLogRepositoryInput,
  QuestionLogListFilters,
} from "../types/question-log.type";
import { Prisma } from "../generated/prisma/client";

const QUESTION_LOG_SELECT = {
  id: true,
  feitas: true,
  acertadas: true,
  data: true,
  topic: {
    select: {
      id: true,
      nome: true,
      subject: {
        select: {
          id: true,
          nome: true,
        },
      },
    },
  },
};

export const questionLogRepository = {
  findTopicInSubject(subjectId: string, topicId: string) {
    return prisma.topic.findFirst({
      where: {
        id: topicId,
        subjectId,
      },
      select: {
        id: true,
      },
    });
  },

  findSessionById(userId: string, sessionId: string) {
    return prisma.studySession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
      select: {
        id: true,
        subjectId: true,
        topicId: true,
      },
    });
  },

  create(userId: string, data: CreateQuestionLogRepositoryInput) {
    return prisma.questionLog.create({
      data: {
        userId,
        topicId: data.topicId,
        feitas: data.feitas,
        acertadas: data.acertadas,
        data: data.data,
      },
      select: QUESTION_LOG_SELECT,
    });
  },

  countLogsForTopicBetween(
    userId: string,
    topicId: string,
    startOfDay: Date,
    endOfDay: Date,
  ) {
    return prisma.questionLog.count({
      where: {
        userId,
        topicId,
        data: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });
  },

  createWithEffects(params: {
    userId: string;
    data: CreateQuestionLogRepositoryInput;
    startOfDay: Date;
    endOfDay: Date;
    grantXp: number;
    shouldAnticipateReview: boolean;
    reviewDate: Date;
  }) {
    return prisma.$transaction(
      async (tx) => {
        const previousLogsToday = await tx.questionLog.count({
          where: {
            userId: params.userId,
            topicId: params.data.topicId,
            data: {
              gte: params.startOfDay,
              lt: params.endOfDay,
            },
          },
        });

        // Histórico completo do assunto ANTES deste registro — usado
        // pelo bônus de melhoria de acerto (comparação antes/depois).
        // Precisa ser lido antes do create abaixo, senão "antes" já
        // incluiria o próprio registro que está sendo criado agora.
        const agregadoAntes = await tx.questionLog.aggregate({
          where: {
            userId: params.userId,
            topicId: params.data.topicId,
          },
          _sum: {
            feitas: true,
            acertadas: true,
          },
        });

        const log = await tx.questionLog.create({
          data: {
            userId: params.userId,
            topicId: params.data.topicId,
            feitas: params.data.feitas,
            acertadas: params.data.acertadas,
            data: params.data.data,
          },
          select: QUESTION_LOG_SELECT,
        });

        const antes = {
          feitas: agregadoAntes._sum.feitas ?? 0,
          acertadas: agregadoAntes._sum.acertadas ?? 0,
        };
        const depois = {
          feitas: antes.feitas + params.data.feitas,
          acertadas: antes.acertadas + params.data.acertadas,
        };

        const xpGanho = previousLogsToday === 0 ? params.grantXp : 0;

        if (xpGanho > 0) {
          await tx.user.update({
            where: {
              id: params.userId,
            },
            data: {
              xpTotal: {
                increment: xpGanho,
              },
            },
          });

          await tx.xpEvent.create({
            data: {
              userId: params.userId,
              quantidade: xpGanho,
              motivo: "Registro de questoes",
            },
          });
        }

        if (params.shouldAnticipateReview) {
          await tx.reviewSchedule.updateMany({
            where: {
              userId: params.userId,
              topicId: params.data.topicId,
              status: "PENDENTE",
              agendadaPara: {
                gt: params.reviewDate,
              },
            },
            data: {
              agendadaPara: params.reviewDate,
            },
          });
        }

        return {
          log,
          xpGanho,
          antes,
          depois,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  },

  incrementUserXp(userId: string, xp: number) {
    return prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        xpTotal: {
          increment: xp,
        },
      },
      select: {
        id: true,
        xpTotal: true,
      },
    });
  },

  createXpEvent(userId: string, xp: number) {
    return prisma.xpEvent.create({
      data: {
        userId,
        quantidade: xp,
        motivo: "Registro de questões",
      },
      select: {
        id: true,
      },
    });
  },

  anticipatePendingReview(userId: string, topicId: string, newDate: Date) {
    return prisma.reviewSchedule.updateMany({
      where: {
        userId,
        topicId,
        status: "PENDENTE",
        agendadaPara: {
          gt: newDate,
        },
      },
      data: {
        agendadaPara: newDate,
      },
    });
  },

  findMany(userId: string, filters: QuestionLogListFilters) {
    return prisma.questionLog.findMany({
      where: buildWhere(userId, filters),
      orderBy: {
        data: "desc",
      },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      select: QUESTION_LOG_SELECT,
    });
  },

  count(userId: string, filters: QuestionLogListFilters) {
    return prisma.questionLog.count({
      where: buildWhere(userId, filters),
    });
  },

  aggregate(userId: string, filters: QuestionLogListFilters) {
    return prisma.questionLog.aggregate({
      where: buildWhere(userId, filters),
      _sum: {
        feitas: true,
        acertadas: true,
      },
    });
  },
};

function buildWhere(userId: string, filters: QuestionLogListFilters) {
  return {
    userId,
    topicId: filters.topicId,
    topic: filters.subjectId
      ? {
          subjectId: filters.subjectId,
        }
      : undefined,
    data: {
      gte: filters.de,
      lt: filters.ate,
    },
  };
}
