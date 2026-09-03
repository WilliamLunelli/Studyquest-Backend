import prisma from "../config/database";
import { GoalType } from "../generated/prisma/enums";

export const goalRepository = {
  findMany(type?: GoalType) {
    return prisma.goal.findMany({
      where: type ? { type } : undefined,
      orderBy: { nome: "asc" },
    });
  },

  findById(id: string) {
    return prisma.goal.findUnique({ where: { id } });
  },

  // Pesos do objetivo com as áreas e as matérias de cada área aninhadas
  // — GET /goals/:id/weights precisa exatamente desse formato.
  findWeightsByGoalId(goalId: string) {
    return prisma.goalWeight.findMany({
      where: { goalId },
      include: {
        area: {
          include: { subjects: true },
        },
      },
    });
  },
};
