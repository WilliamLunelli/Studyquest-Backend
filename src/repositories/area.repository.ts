import prisma from "../config/database";

export const areaRepository = {
  async findAreaById(id: string) {
    return await prisma.area.findFirst({
      where: { id },
    });
  },
};
