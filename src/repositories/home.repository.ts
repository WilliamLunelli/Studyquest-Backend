import prisma from "../config/database";

export const homeRepository = {
  findUserHomeData(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        xpTotal: true,
        streakAtual: true,
        streakRecorde: true,
        availabilities: {
          select: {
            diaSemana: true,
            minutos: true,
          },
        },
      },
    });
  },

  findActiveCycleWithBlocks(userId: string) {
    return prisma.studyCycle.findFirst({
      where: {
        userId,
        ativo: true,
      },
      select: {
        id: true,
        posicaoAtual: true,
        blocks: {
          orderBy: {
            ordem: "asc",
          },
          select: {
            id: true,
            ordem: true,
            duracao: true,
            status: true,
            subject: {
              select: {
                id: true,
                nome: true,
              },
            },
            topic: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
      },
    });
  },

  findPendingReviewsUntil(userId: string, endOfDay: Date) {
    return prisma.reviewSchedule.findMany({
      where: {
        userId,
        status: "PENDENTE",
        agendadaPara: {
          lt: endOfDay,
        },
      },
      orderBy: {
        agendadaPara: "asc",
      },
      select: {
        id: true,
        agendadaPara: true,
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
      },
    });
  },

  sumFinishedMinutesToday(userId: string, startOfDay: Date, endOfDay: Date) {
    return prisma.studySession.aggregate({
      where: {
        userId,
        status: "FINISHED",
        finishedAt: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      _sum: {
        minutosAcumulados: true,
      },
    });
  },

  countRunningSessions() {
    return prisma.studySession.count({
      where: {
        status: "RUNNING",
      },
    });
  },
};
