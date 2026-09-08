import prisma from "../config/database";

export const completedTopicRepository = {
  findByUserAndTopic(userId: string, topicId: string) {
    return prisma.completedTopic.findUnique({
      where: { userId_topicId: { userId, topicId } },
      select: { id: true },
    });
  },

  create(userId: string, topicId: string) {
    return prisma.completedTopic.create({
      data: { userId, topicId },
      select: { id: true },
    });
  },

  listTopicIdsByUser(userId: string) {
    return prisma.completedTopic.findMany({
      where: { userId },
      select: { topicId: true },
    });
  },
};
