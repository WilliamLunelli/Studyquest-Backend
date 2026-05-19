import prisma from "../config/database";

export const sessionRepository = {
  async listStudySessions(userId: string) {
    return await prisma.studySession.findMany({
      where: { userId },
      orderBy: { studiedAt: "desc" },
    });
  },

  async createStudySession(data: {
    userId: string;
    subjectId: string;
    studyTime: number;
    questions: number;
    rate: number;
    studiedAt: Date;
    xpEarned: number;
    correctAnswers?: number;
    sessionType?: string;
    pomodoroCount?: number;
    notes?: string;
  }) {
    return await prisma.studySession.create({ data });
  },
};
