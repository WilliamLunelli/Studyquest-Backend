import prisma from "../config/database";

export const areaRepository = {
  async findAreaById(id: string) {
    return await prisma.area.findFirst({
      where: { id },
    });
  },

  async createArea(userId: string, areaName: string, areaDescription?: string) {
    return await prisma.area.create({
      data: { userId, areaName, areaDescription },
    });
  },

  async listAreas(userId: string) {
    return await prisma.area.findMany({
      where: { userId },
      include: { subjects: true },
    });
  },
};
