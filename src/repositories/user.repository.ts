import prisma from "../config/database";

export const userRepository = {
  async incrementXP(userId: string, xp: number) {
    return prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: xp } },
    });
  },
};
