import prisma from "../config/database";

const REVIEW_SELECT = {
  id: true,
  agendadaPara: true,
  repeticao: true,
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

export const reviewRepository = {
  archiveVeryLateReviews(userId: string, beforeDate: Date) {
    return prisma.reviewSchedule.updateMany({
      where: {
        userId,
        status: "PENDENTE",
        agendadaPara: {
          lt: beforeDate,
        },
      },
      data: {
        status: "ARQUIVADA",
      },
    });
  },

  findTodayAndOverdue(userId: string, endOfDay: Date) {
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
      select: REVIEW_SELECT,
    });
  },

  findById(userId: string, reviewId: string) {
    return prisma.reviewSchedule.findFirst({
      where: {
        id: reviewId,
        userId,
      },
      select: REVIEW_SELECT,
    });
  },

  findLastFinishedSessionByTopic(userId: string, topicId: string) {
    return prisma.studySession.findFirst({
      where: {
        userId,
        topicId,
        status: "FINISHED",
      },
      orderBy: {
        finishedAt: "desc",
      },
      select: {
        finishedAt: true,
        selfRating: true,
        minutosAcumulados: true,
      },
    });
  },

  findUpcoming(userId: string, startDate: Date, endDate: Date) {
    return prisma.reviewSchedule.findMany({
      where: {
        userId,
        status: "PENDENTE",
        agendadaPara: {
          gte: startDate,
          lt: endDate,
        },
      },
      orderBy: {
        agendadaPara: "asc",
      },
      select: REVIEW_SELECT,
    });
  },
};
