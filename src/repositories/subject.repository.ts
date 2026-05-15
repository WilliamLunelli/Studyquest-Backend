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

  async getSubjectsById(
    userId: string,
    skip: number,
    take: number,
    areaId?: string,
  ) {
    if (areaId) {
      return prisma.area.findMany({
        skip,
        take,
        where: { id: areaId, userId },
        select: {
          id: true,
          areaName: true,
          areaDescription: true,
          subjects: {
            select: {
              id: true,
              subjectName: true,
              subjectDescription: true,
            },
          },
        },
      });
    }

    return prisma.area.findMany({
      skip,
      take,
      where: { userId },
      select: {
        id: true,
        areaName: true,
        areaDescription: true,
        subjects: {
          select: {
            id: true,
            subjectName: true,
            subjectDescription: true,
          },
        },
      },
    });
  },

  async countSubjects(userId: string, areaId?: string) {
    if (areaId) {
      return prisma.subject.count({
        where: { areaId, area: { userId } },
      });
    }

    return prisma.subject.count({
      where: { area: { userId } },
    });
  },

  async getSubjectById(subjectId: string) {
    return prisma.subject.findFirst({
      where: { id: subjectId },
      select: {
        id: true,
        subjectName: true,
        subjectDescription: true,
        area: {
          select: {
            userId: true,
            areaName: true,
            areaDescription: true,
          },
        },
      },
    });
  },
};
