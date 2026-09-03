import prisma from "../config/database";

export const studyCycleRepository = {
  // Só isto: desativa o(s) ciclo(s) ativo(s) do usuário, se houver.
  // Geração/leitura de ciclo é o bloco B — fora do escopo do Módulo 1.
  invalidateActiveCycle(userId: string) {
    return prisma.studyCycle.updateMany({
      where: { userId, ativo: true },
      data: { ativo: false },
    });
  },
};
