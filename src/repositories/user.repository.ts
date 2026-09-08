import prisma from "../config/database";
import { Prisma } from "../generated/prisma/client";

type Client = Prisma.TransactionClient;

export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  create(data: { email: string; username: string; password: string }) {
    return prisma.user.create({ data });
  },

  setGoal(userId: string, goalId: string) {
    return prisma.user.update({ where: { id: userId }, data: { goalId } });
  },

  // Inclui o objetivo ativo (join simples) porque GET /auth/me sempre
  // precisa dele — evita um segundo método quase idêntico só por causa
  // de um include a mais.
  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { goal: true },
    });
  },

  // Dificuldade >= 1 é o corte: 0 é o sentinel de "matéria ainda não
  // avaliada" (ver comentário no schema.prisma, model UserDifficulty).
  countFilledDifficulties(userId: string) {
    return prisma.userDifficulty.count({
      where: { userId, dificuldade: { gte: 1 } },
    });
  },

  // Quantas matérias existem nas áreas do objetivo — não é uma
  // relação direta do User, por isso recebe o goalId em vez de
  // vir de dentro de um _count aninhado.
  countSubjectsForGoal(goalId: string) {
    return prisma.subject.count({
      where: { area: { goalWeights: { some: { goalId } } } },
    });
  },

  countAvailabilityDays(userId: string) {
    return prisma.userAvailability.count({ where: { userId } });
  },

  // Usado pela avaliação retroativa de streak (gamification.service):
  // precisa de quando a conta foi criada (piso da varredura quando o
  // usuário nunca estudou) e da meta de minutos por dia da semana.
  // Aceita `client` pra rodar dentro da transação do finish em vez de
  // abrir uma consulta solta fora dela.
  findForStreakEvaluation(userId: string, client: Client = prisma) {
    return client.user.findUnique({
      where: { id: userId },
      select: {
        createdAt: true,
        streakAtual: true,
        streakRecorde: true,
        availabilities: {
          select: { diaSemana: true, minutos: true },
        },
      },
    });
  },

  updateStreak(
    userId: string,
    data: { streakAtual: number; streakRecorde: number },
    client: Client = prisma,
  ) {
    return client.user.update({
      where: { id: userId },
      data,
      select: { streakAtual: true, streakRecorde: true },
    });
  },
};
