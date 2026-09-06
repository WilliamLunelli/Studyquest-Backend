import prisma from "../config/database";
import { Prisma } from "../generated/prisma/client";
import { userRepository } from "../repositories/user.repository";
import { sessionRepository } from "../repositories/session.repository";
import { streakShieldRepository } from "../repositories/streak-shield.repository";
import { xpEventRepository } from "../repositories/xp-event.repository";
import { improvedTopicRepository } from "../repositories/improved-topic.repository";
import {
  AcertoAgregado,
  calcularBonusAssuntoConcluido,
  calcularBonusMelhoriaAcerto,
} from "../utils/xp.utils";

const TIMEZONE = "America/Sao_Paulo";

type Client = Prisma.TransactionClient;

// ---------------------------------------------------------------------------
// Bônus fixos (assunto concluído / melhoria de acerto)
// ---------------------------------------------------------------------------

/**
 * +200 XP por assunto do ciclo concluído. Quem garante "uma única vez
 * por assunto" é o chamador: só chame isto na transição de um
 * CycleBlock PENDENTE -> CONCLUIDO, nunca de novo se já estava
 * CONCLUIDO. Este serviço não tem como saber isso sozinho — XpEvent
 * não guarda referência a qual assunto gerou o bônus.
 *
 * `client` é opcional: passe a transação do chamador quando já existir
 * uma (ex.: dentro do finish); sem ele, abre a própria transação.
 */
export function concederBonusAssuntoConcluido(userId: string, client?: Client) {
  const xp = calcularBonusAssuntoConcluido();
  const motivo = "Assunto do ciclo concluído";

  return client
    ? xpEventRepository.grantWithClient(client, userId, xp, motivo)
    : xpEventRepository.grant(userId, xp, motivo);
}

/**
 * +300 XP quando o acerto de um assunto sai de <50% para >70%
 * (histórico completo do assunto, com piso de amostra — ver
 * calcularBonusMelhoriaAcerto). Idempotente pra sempre por assunto,
 * via ImprovedTopic: se o usuário cair e subir de novo, não paga de
 * novo. Retorna sempre `{concedido, xp}`, nunca null, pra não obrigar
 * o chamador a distinguir "sem bônus" de "erro".
 */
export async function concederBonusMelhoriaAcerto(
  userId: string,
  topicId: string,
  antes: AcertoAgregado,
  depois: AcertoAgregado,
  client?: Client,
): Promise<{ concedido: boolean; xp: number }> {
  const xp = calcularBonusMelhoriaAcerto(antes, depois);

  if (xp === 0) {
    return { concedido: false, xp: 0 };
  }

  const jaConcedido = await improvedTopicRepository.findByUserAndTopic(
    userId,
    topicId,
    client,
  );

  if (jaConcedido) {
    return { concedido: false, xp: 0 };
  }

  await improvedTopicRepository.create(userId, topicId, client);

  const motivo = "Assunto saiu de acerto baixo para alto";

  await (client
    ? xpEventRepository.grantWithClient(client, userId, xp, motivo)
    : xpEventRepository.grant(userId, xp, motivo));

  return { concedido: true, xp };
}

// ---------------------------------------------------------------------------
// Streak: avaliação retroativa (lazy)
// ---------------------------------------------------------------------------

export type DiaStreak = {
  /** Dia representado como meia-noite UTC — só usado como chave de calendário, nunca como instante real. */
  data: Date;
  /** Minutos de meta para aquele dia da semana. 0 = dia neutro (não conta a favor nem contra o streak). */
  metaMinutos: number;
  /** "YYYY-MM", usado para agrupar consumo de escudo por mês. */
  chaveMes: string;
};

export type AvaliacaoStreakResult = {
  streakFinal: number;
  streakZerado: boolean;
  recordeFinal: number;
  /** Escudos consumidos NESTA varredura, por "YYYY-MM" — ainda não persistido. */
  consumoEscudosPorMes: Record<string, number>;
};

/**
 * Função pura: dado o histórico de dias sem estudo (já resolvidos com
 * a meta de cada um) e quantos escudos existem disponíveis por mês,
 * decide se o streak sobrevive (consumindo escudo) ou zera.
 *
 * Um dia SEMPRE representa uma falha em potencial: esta lista só
 * contém dias estritamente entre o último dia estudado e hoje, ou
 * seja, dias em que sabidamente não houve nenhuma sessão concluída.
 * Dia com metaMinutos <= 0 nunca falha (regra 7: não premiar nem
 * punir a ausência de dado quando não havia meta nenhuma).
 *
 * Assim que o streak zera, os dias seguintes deixam de importar pra
 * esta varredura (streak já é 0, não há mais o que preservar).
 */
export function avaliarDiasFalhosRetroativo(
  dias: DiaStreak[],
  streakAtual: number,
  streakRecorde: number,
  escudosDisponiveisPorMes: Record<string, number>,
): AvaliacaoStreakResult {
  let streak = streakAtual;
  let zerado = false;

  const disponiveis = { ...escudosDisponiveisPorMes };
  const consumo: Record<string, number> = {};

  for (const dia of dias) {
    if (zerado) {
      break;
    }

    if (dia.metaMinutos <= 0) {
      continue;
    }

    const restantes = disponiveis[dia.chaveMes] ?? 0;

    if (restantes > 0) {
      disponiveis[dia.chaveMes] = restantes - 1;
      consumo[dia.chaveMes] = (consumo[dia.chaveMes] ?? 0) + 1;
      continue;
    }

    streak = 0;
    zerado = true;
  }

  return {
    streakFinal: streak,
    streakZerado: zerado,
    recordeFinal: Math.max(streakRecorde, streak),
    consumoEscudosPorMes: consumo,
  };
}

/**
 * Orquestra a avaliação retroativa: busca o último dia estudado, monta
 * a lista de dias em aberto entre ele e hoje, consulta os escudos
 * disponíveis por mês envolvido, aplica a função pura e persiste o
 * resultado (streak do usuário + consumo de escudo). Chamado sob
 * demanda ("lazy") sempre que o usuário age de novo — não há cron
 * job neste projeto para rodar isso todo dia.
 */
export async function avaliarStreakRetroativo(
  userId: string,
  agora: Date = new Date(),
  excludeSessionId?: string,
  client?: Client,
): ReturnType<typeof avaliarStreakRetroativoComClient> {
  // Sem client: abre a própria transação e recursa passando ela adiante,
  // pra garantir que a leitura do streak/escudo e a escrita de volta
  // fiquem atômicas mesmo quando chamado sozinho (fora do finish).
  if (!client) {
    return prisma.$transaction((tx) =>
      avaliarStreakRetroativo(userId, agora, excludeSessionId, tx),
    );
  }

  return avaliarStreakRetroativoComClient(userId, agora, excludeSessionId, client);
}

async function avaliarStreakRetroativoComClient(
  userId: string,
  agora: Date,
  excludeSessionId: string | undefined,
  client: Client,
) {
  const user = await userRepository.findForStreakEvaluation(userId, client);

  if (!user) {
    throw new Error("Usuário não encontrado para avaliação de streak.");
  }

  const ultimoDiaEstudado = await sessionRepository.findLastStudiedDay(
    userId,
    excludeSessionId,
    client,
  );
  const inicio = diaEmSaoPaulo(ultimoDiaEstudado ?? user.createdAt);
  const hoje = diaEmSaoPaulo(agora);

  const disponibilidadePorDiaSemana = new Map(
    user.availabilities.map((a) => [a.diaSemana, a.minutos]),
  );

  const dias = construirDiasEmAberto(inicio, hoje, disponibilidadePorDiaSemana);

  if (dias.length === 0) {
    return {
      diasAvaliados: 0,
      streakAnterior: user.streakAtual,
      streakFinal: user.streakAtual,
      streakZerado: false,
      recordeFinal: user.streakRecorde,
      escudosConsumidos: 0,
    };
  }

  const mesesEnvolvidos = [...new Set(dias.map((d) => d.chaveMes))];
  const escudosDisponiveisPorMes: Record<string, number> = {};

  for (const chave of mesesEnvolvidos) {
    const { mes, ano } = parseChaveMes(chave);
    escudosDisponiveisPorMes[chave] = await streakShieldRepository.getDisponiveis(
      userId,
      mes,
      ano,
      client,
    );
  }

  const resultado = avaliarDiasFalhosRetroativo(
    dias,
    user.streakAtual,
    user.streakRecorde,
    escudosDisponiveisPorMes,
  );

  for (const [chave, quantidade] of Object.entries(resultado.consumoEscudosPorMes)) {
    const { mes, ano } = parseChaveMes(chave);
    await streakShieldRepository.registrarConsumo(userId, mes, ano, quantidade, client);
  }

  if (
    resultado.streakFinal !== user.streakAtual ||
    resultado.recordeFinal !== user.streakRecorde
  ) {
    await userRepository.updateStreak(
      userId,
      {
        streakAtual: resultado.streakFinal,
        streakRecorde: resultado.recordeFinal,
      },
      client,
    );
  }

  return {
    diasAvaliados: dias.length,
    streakAnterior: user.streakAtual,
    streakFinal: resultado.streakFinal,
    streakZerado: resultado.streakZerado,
    recordeFinal: resultado.recordeFinal,
    escudosConsumidos: Object.values(resultado.consumoEscudosPorMes).reduce(
      (soma, n) => soma + n,
      0,
    ),
  };
}

function construirDiasEmAberto(
  inicio: Date,
  hoje: Date,
  disponibilidadePorDiaSemana: Map<number, number>,
): DiaStreak[] {
  const dias: DiaStreak[] = [];

  for (let d = addDias(inicio, 1); d.getTime() < hoje.getTime(); d = addDias(d, 1)) {
    dias.push({
      data: d,
      metaMinutos: disponibilidadePorDiaSemana.get(d.getUTCDay()) ?? 0,
      chaveMes: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
    });
  }

  return dias;
}

/** Meia-noite (UTC, usado só como chave de calendário) do dia civil em America/Sao_Paulo correspondente ao instante `data`. */
function diaEmSaoPaulo(data: Date): Date {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(data);

  const ano = Number(partes.find((p) => p.type === "year")!.value);
  const mes = Number(partes.find((p) => p.type === "month")!.value);
  const dia = Number(partes.find((p) => p.type === "day")!.value);

  return new Date(Date.UTC(ano, mes - 1, dia));
}

function addDias(data: Date, dias: number): Date {
  const resultado = new Date(data);
  resultado.setUTCDate(resultado.getUTCDate() + dias);
  return resultado;
}

function parseChaveMes(chave: string): { mes: number; ano: number } {
  const [anoStr, mesStr] = chave.split("-");
  return { mes: Number(mesStr), ano: Number(anoStr) };
}
