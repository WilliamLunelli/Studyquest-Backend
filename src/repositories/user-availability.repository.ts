import prisma from "../config/database";

export const userAvailabilityRepository = {
  // Upsert por dia (userId + diaSemana é @@unique) dentro de uma
  // transação: PUT sempre substitui os 7 dias de uma vez, sem deixar
  // estado parcial se algo falhar no meio.
  replaceAll(
    userId: string,
    disponibilidade: { diaSemana: number; minutos: number }[],
  ) {
    return prisma.$transaction(
      disponibilidade.map((dia) =>
        prisma.userAvailability.upsert({
          where: { userId_diaSemana: { userId, diaSemana: dia.diaSemana } },
          update: { minutos: dia.minutos },
          create: { userId, diaSemana: dia.diaSemana, minutos: dia.minutos },
        }),
      ),
    );
  },
};
