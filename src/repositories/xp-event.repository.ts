import prisma from "../config/database";
import { Prisma } from "../generated/prisma/client";
import { calcularNivel } from "../utils/level.utils";

type Client = Prisma.TransactionClient;

/**
 * Incrementa xpTotal, recalcula o nível (nunca regride) e grava o
 * XpEvent. Recebe `client` em vez de abrir a própria transação porque
 * é chamada tanto sozinha (grant) quanto de dentro de uma transação
 * maior que já existe (grantWithClient, usado pelo finish).
 */
async function applyGrant(
  client: Client,
  userId: string,
  quantidade: number,
  motivo: string,
) {
  const user = await client.user.update({
    where: { id: userId },
    data: { xpTotal: { increment: quantidade } },
    select: { xpTotal: true, level: true },
  });

  const nivelAnterior = user.level;
  const nivelCalculado = calcularNivel(user.xpTotal).nivel;
  const nivelAtual = Math.max(nivelAnterior, nivelCalculado);

  if (nivelAtual !== nivelAnterior) {
    await client.user.update({
      where: { id: userId },
      data: { level: nivelAtual },
    });
  }

  await client.xpEvent.create({
    data: { userId, quantidade, motivo },
  });

  return {
    xpTotal: user.xpTotal,
    nivelAnterior,
    nivelAtual,
    subiuDeNivel: nivelAtual !== nivelAnterior,
  };
}

export const xpEventRepository = {
  create(userId: string, quantidade: number, motivo: string) {
    return prisma.xpEvent.create({
      data: { userId, quantidade, motivo },
      select: { id: true },
    });
  },

  listByUser(userId: string, limit = 50) {
    return prisma.xpEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  /**
   * Concede XP fora de uma transação já aberta pelo chamador (ex.:
   * bônus de assunto concluído chamado direto do service): abre a
   * própria transação, garantindo que toda concessão de XP tenha,
   * sem exceção, uma linha auditável.
   */
  grant(userId: string, quantidade: number, motivo: string) {
    return prisma.$transaction((tx) => applyGrant(tx, userId, quantidade, motivo));
  },

  /**
   * Mesma lógica de `grant`, mas participando de uma transação que o
   * chamador já abriu (ex.: o finish) — nunca abre `prisma.$transaction`
   * aqui dentro, porque isso criaria uma segunda transação independente
   * e quebraria a regra de "finish é uma transação única com rollback
   * completo".
   */
  grantWithClient(client: Client, userId: string, quantidade: number, motivo: string) {
    return applyGrant(client, userId, quantidade, motivo);
  },
};
