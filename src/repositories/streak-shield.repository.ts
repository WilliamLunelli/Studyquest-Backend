import prisma from "../config/database";
import { Prisma } from "../generated/prisma/client";

const ESCUDOS_POR_MES = 2;

type Client = Prisma.TransactionClient;

export const streakShieldRepository = {
  /**
   * Não existe job que cria as 2 linhas no dia 1: a "renovação mensal"
   * é implícita — um (mes, ano) sem linha ainda tem os 2 escudos
   * inteiros disponíveis, a linha só é criada quando o primeiro
   * consumo daquele mês acontece.
   *
   * Aceita `client` opcional para participar de uma transação que já
   * existe (ex.: a avaliação de streak dentro do finish) em vez de
   * abrir uma consulta solta fora dela.
   */
  async getDisponiveis(userId: string, mes: number, ano: number, client: Client = prisma) {
    const shield = await client.streakShield.findUnique({
      where: { userId_mes_ano: { userId, mes, ano } },
      select: { usados: true },
    });

    return ESCUDOS_POR_MES - (shield?.usados ?? 0);
  },

  /**
   * Registra `quantidade` escudos consumidos naquele mês. Quem decide
   * quanto pode ser consumido é o chamador (a avaliação de streak lê
   * getDisponiveis antes) — aqui só persiste, sem revalidar o teto,
   * pra não duplicar a regra de negócio em duas camadas.
   */
  registrarConsumo(
    userId: string,
    mes: number,
    ano: number,
    quantidade: number,
    client: Client = prisma,
  ) {
    return client.streakShield.upsert({
      where: { userId_mes_ano: { userId, mes, ano } },
      create: {
        userId,
        mes,
        ano,
        usados: quantidade,
        usadoEm: new Date(),
      },
      update: {
        usados: { increment: quantidade },
        usadoEm: new Date(),
      },
    });
  },
};
