import prisma from "../config/database";

export const userDifficultyRepository = {
  // Cria uma linha zerada (dificuldade = 0, "não respondido") para cada
  // matéria do objetivo escolhido. skipDuplicates porque o usuário pode
  // trocar de objetivo mais de uma vez e cair nas mesmas matérias
  // (ex.: dois objetivos ENEM compartilham as mesmas 5 áreas/matérias).
  createManyZeroed(userId: string, subjectIds: string[]) {
    return prisma.userDifficulty.createMany({
      data: subjectIds.map((subjectId) => ({
        userId,
        subjectId,
        dificuldade: 0,
      })),
      skipDuplicates: true,
    });
  },

  // Upsert por matéria (userId + subjectId é @@unique) — grava o nível
  // real por cima do 0 default, dentro de uma transação.
  updateMany(
    userId: string,
    dificuldades: { subjectId: string; nivel: number }[],
  ) {
    return prisma.$transaction(
      dificuldades.map((item) =>
        prisma.userDifficulty.upsert({
          where: {
            userId_subjectId: { userId, subjectId: item.subjectId },
          },
          update: { dificuldade: item.nivel },
          create: {
            userId,
            subjectId: item.subjectId,
            dificuldade: item.nivel,
          },
        }),
      ),
    );
  },
};
