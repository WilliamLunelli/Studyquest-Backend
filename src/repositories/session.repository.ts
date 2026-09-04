import prisma from "../config/database";
import { CreateSessionInput } from "../types/session.types";

const SESSION_SELECT = {
  id: true,
  userId: true,
  status: true,
  startedAt: true,
  resumedAt: true,
  minutosAcumulados: true,
  preset: true,
  type: true,
};

export const sessionRepository = {
  findActiveByUserId(userId: string) {
    return prisma.studySession.findFirst({
      where: { userId, status: { in: ["RUNNING", "PAUSED"] } },
      select: SESSION_SELECT,
    });
  },

  findById(id: string) {
    return prisma.studySession.findUnique({
      where: { id },
      select: SESSION_SELECT,
    });
  },

  findSubjectById(subjectId: string) {
    return prisma.subject.findUnique({
      where: { id: subjectId },
      select: { id: true },
    });
  },

  findTopicById(topicId: string) {
    return prisma.topic.findUnique({
      where: { id: topicId },
      select: { id: true },
    });
  },

  create(userId: string, data: CreateSessionInput) {
    // startedAt and resumedAt are written with the same instant: that's
    // what makes calculateAccumulatedMinutes treat a "just created
    // session" and a "resumed session" the same way (RUNNING = minutosAcumulados
    // + (now - resumedAt)), without a special case for a brand-new session.
    const now = new Date();

    return prisma.studySession.create({
      data: {
        userId,
        subjectId: data.subjectId,
        topicId: data.topicId,
        cycleBlockId: data.blocoId ?? null,
        originReviewId: data.reviewId ?? null,
        type: data.tipo,
        preset: data.preset,
        startedAt: now,
        resumedAt: now,
      },
      select: SESSION_SELECT,
    });
  },

  pause(id: string, accumulatedMinutes: number) {
    return prisma.studySession.update({
      where: { id },
      data: {
        status: "PAUSED",
        minutosAcumulados: accumulatedMinutes,
        resumedAt: null,
      },
      select: SESSION_SELECT,
    });
  },

  resume(id: string) {
    return prisma.studySession.update({
      where: { id },
      data: {
        status: "RUNNING",
        resumedAt: new Date(),
      },
      select: SESSION_SELECT,
    });
  },
};
