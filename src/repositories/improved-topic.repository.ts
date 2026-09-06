import prisma from "../config/database";
import { Prisma } from "../generated/prisma/client";

type Client = Prisma.TransactionClient;

export const improvedTopicRepository = {
  findByUserAndTopic(userId: string, topicId: string, client: Client = prisma) {
    return client.improvedTopic.findUnique({
      where: { userId_topicId: { userId, topicId } },
      select: { id: true },
    });
  },

  create(userId: string, topicId: string, client: Client = prisma) {
    return client.improvedTopic.create({
      data: { userId, topicId },
      select: { id: true },
    });
  },
};
