import prisma from "../config/database";

export const subjectRepostiory = {
  async createSubject(
    areaId: string,
    subjectName: string,
    subjectDescription?: string,
  ) {
    return prisma.subject.create({
      data: { areaId, subjectName, subjectDescription },
    });
  },
};
