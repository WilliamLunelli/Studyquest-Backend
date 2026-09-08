import { dashboardRepository } from "../repositories/dashboard.repository";
import { streakShieldRepository } from "../repositories/streak-shield.repository";
import * as cycleService from "./cycle.service";
import { checkOnboardingStatus } from "./user.service";
import { AppError } from "../utils/app-error";
import { DashboardPeriodoQuery } from "../validations/dashboard.validation";
import {
  calcularBlocosPlanejados,
  calcularDiasEfetivos,
  calcularDuracaoMediaBloco,
  calcularPercentual,
  calcularPercentualAderencia,
  ehExcessoConfianca,
  ehRevisaoAntecipada,
} from "../utils/dashboard.utils";
import {
  AderenciaCicloResumo,
  CoberturaResumo,
  DashboardPeriodo,
  DashboardQueryInput,
  DashboardResponse,
  AcertoPorAssuntoItem,
  ExcessoConfiancaItem,
  StreakResumo,
} from "../types/dashboard.types";

const PERIODO_DIAS: Record<DashboardPeriodo, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

const DEFAULT_PERIODO: DashboardPeriodo = "30d";

export async function getDashboard(
  userId: string,
  query: DashboardQueryInput,
): Promise<DashboardResponse> {
  const periodo = parsePeriodo(query.periodo);
  const periodoDias = PERIODO_DIAS[periodo];
  const { start, end } = cycleService.buildPeriodoRange(periodoDias);

  const userGoal = await dashboardRepository.getUserGoalId(userId);

  if (!userGoal) {
    throw new AppError(404, "Usuário não encontrado.");
  }

  const [
    onboardingCompleto,
    cobertura,
    acertoEExcesso,
    escudosDisponiveis,
    aderenciaCiclo,
  ] = await Promise.all([
    checkOnboardingStatus(userId),
    getCobertura(userId, userGoal.goalId),
    getAcertoEExcessoConfianca(userId, start, end),
    getEscudosDisponiveis(userId),
    getAderenciaCiclo(userId, start, end),
  ]);

  const horasPorMateria = onboardingCompleto
    ? await cycleService.getCycleAlignment(userId, periodoDias)
    : [];

  const streak: StreakResumo = {
    atual: userGoal.streakAtual,
    recorde: userGoal.streakRecorde,
    escudosDisponiveis,
  };

  return {
    cobertura,
    horasPorMateria,
    acertoPorAssunto: acertoEExcesso.acertoPorAssunto,
    excessoConfianca: acertoEExcesso.excessoConfianca,
    streak,
    aderenciaCiclo,
  };
}

function parsePeriodo(value: unknown): DashboardPeriodo {
  const result = DashboardPeriodoQuery.safeParse(value);

  if (!result.success) {
    throw new AppError(422, "Parametro 'periodo' invalido. Use 7d, 30d ou 90d.");
  }

  return result.data ?? DEFAULT_PERIODO;
}

async function getCobertura(
  userId: string,
  goalId: string | null,
): Promise<CoberturaResumo> {
  if (!goalId) {
    return { assuntosTotais: 0, assuntosVistos: 0, percentual: 0 };
  }

  const [assuntosTotais, assuntosVistos] = await Promise.all([
    dashboardRepository.countTopicsForGoal(goalId),
    dashboardRepository.countDistinctTopicsSeenForGoal(userId, goalId),
  ]);

  const percentual = calcularPercentual(assuntosVistos, assuntosTotais);

  return { assuntosTotais, assuntosVistos, percentual };
}

async function getEscudosDisponiveis(userId: string) {
  const hoje = new Date();
  return streakShieldRepository.getDisponiveis(
    userId,
    hoje.getMonth() + 1,
    hoje.getFullYear(),
  );
}

/**
 * blocosPlanejados vem da disponibilidade semanal escalada pro período,
 * dividida pela duração média dos blocos do ciclo ATIVO — não há como
 * reconstruir quantos blocos deveriam ter sido cumpridos a partir de
 * voltasCompletas/posicaoAtual porque esses campos não guardam snapshot
 * histórico (regenerar o ciclo no meio do período zera os dois). Sem
 * ciclo ativo ou com duração média 0, blocosPlanejados fica 0 (nunca
 * NaN/Infinity). percentual pode passar de 100 — cumprir mais blocos que
 * o planejado é informação válida, não um erro a esconder.
 *
 * A escala usa calcularDiasEfetivos ancorado no createdAt do CICLO
 * ATIVO, não do usuário: regenerar o ciclo (troca de objetivo, mudança
 * de disponibilidade) é ação normal, não caso raro — se a âncora fosse
 * a conta, um ciclo de 5 dias consultado com periodo=30d ainda
 * escalaria os planejados pelos 30 dias inteiros mesmo o ciclo atual
 * só existindo há 5. NÃO troque essa âncora achando redundância.
 */
async function getAderenciaCiclo(
  userId: string,
  start: Date,
  end: Date,
): Promise<AderenciaCicloResumo> {
  const [cycle, disponibilidade, blocosConcluidos] = await Promise.all([
    dashboardRepository.getActiveCycleBlockDurations(userId),
    dashboardRepository.getWeeklyAvailabilityMinutes(userId),
    dashboardRepository.countFinishedBlockSessions(userId, start, end),
  ]);

  const duracaoMediaBloco = calcularDuracaoMediaBloco(
    cycle?.blocks.map((bloco) => bloco.duracao) ?? [],
  );

  const minutosSemana = disponibilidade._sum.minutos ?? 0;
  const periodoDias = Math.round((end.getTime() - start.getTime()) / 86400000);
  const diasEfetivos = cycle
    ? calcularDiasEfetivos(periodoDias, cycle.createdAt)
    : periodoDias;

  const blocosPlanejados = calcularBlocosPlanejados(
    minutosSemana,
    diasEfetivos,
    duracaoMediaBloco,
  );

  const percentual = calcularPercentualAderencia(blocosPlanejados, blocosConcluidos);

  return { blocosPlanejados, blocosConcluidos, percentual };
}

async function getAcertoEExcessoConfianca(
  userId: string,
  start: Date,
  end: Date,
): Promise<{
  acertoPorAssunto: AcertoPorAssuntoItem[];
  excessoConfianca: ExcessoConfiancaItem[];
}> {
  const [aggregates, tranquiloCounts] = await Promise.all([
    dashboardRepository.getQuestionLogTopicAggregates(userId, start, end),
    dashboardRepository.getTranquiloCountsByTopic(userId, start, end),
  ]);

  const acertoPorTopico = new Map<
    string,
    { feitas: number; acertadas: number; percentual: number }
  >();

  for (const item of aggregates) {
    if (!item.topicId) {
      continue;
    }

    const feitas = item._sum.feitas ?? 0;
    const acertadas = item._sum.acertadas ?? 0;
    const percentual = calcularPercentual(acertadas, feitas);

    acertoPorTopico.set(item.topicId, { feitas, acertadas, percentual });
  }

  // Candidatos a excessoConfianca: já passaram pelos pisos de amostra
  // (>=10 questões) e de autoavaliação (>=3 TRANQUILO) no banco (`having`
  // em ambas as queries acima). Só falta o corte de <60% de acerto.
  const candidatosExcesso = [...tranquiloCounts]
    .filter((item): item is typeof item & { topicId: string } => item.topicId !== null)
    .map((item) => {
      const acerto = acertoPorTopico.get(item.topicId);

      if (!acerto) {
        return null;
      }

      return {
        topicId: item.topicId,
        autoavaliacoesTranquilo: item._count.topicId,
        ...acerto,
      };
    })
    .filter(
      (item): item is NonNullable<typeof item> =>
        item !== null &&
        ehExcessoConfianca(item.autoavaliacoesTranquilo, item.percentual),
    );

  const topicIdsEnvolvidos = [
    ...new Set([
      ...acertoPorTopico.keys(),
      ...candidatosExcesso.map((item) => item.topicId),
    ]),
  ];

  const [nomes, logsDosCandidatos] = await Promise.all([
    dashboardRepository.getTopicNames(topicIdsEnvolvidos),
    dashboardRepository.getQuestionLogRowsForTopics(
      userId,
      candidatosExcesso.map((item) => item.topicId),
      start,
      end,
    ),
  ]);

  const nomePorTopico = new Map(
    nomes.map((topic) => [
      topic.id,
      { assunto: topic.nome, materia: topic.subject.nome },
    ]),
  );

  // A regra real de antecipação (question-log.service.ts) olha cada
  // registro individual, não a média do período — por isso este cálculo
  // reproduz o mesmo critério em cima dos registros brutos, não do
  // agregado já somado acima.
  const antecipadaPorTopico = new Set<string>();

  for (const log of logsDosCandidatos) {
    if (log.topicId && ehRevisaoAntecipada(log.feitas, log.acertadas)) {
      antecipadaPorTopico.add(log.topicId);
    }
  }

  const acertoPorAssunto: AcertoPorAssuntoItem[] = [...acertoPorTopico.entries()]
    .map(([topicId, dados]) => {
      const nome = nomePorTopico.get(topicId);

      return {
        topicId,
        assunto: nome?.assunto ?? "",
        materia: nome?.materia ?? "",
        feitas: dados.feitas,
        acertadas: dados.acertadas,
        percentual: dados.percentual,
      };
    })
    .sort((a, b) => a.percentual - b.percentual);

  const excessoConfianca: ExcessoConfiancaItem[] = candidatosExcesso
    .map((item) => {
      const nome = nomePorTopico.get(item.topicId);

      return {
        topicId: item.topicId,
        assunto: nome?.assunto ?? "",
        materia: nome?.materia ?? "",
        autoavaliacoesTranquilo: item.autoavaliacoesTranquilo,
        percentualAcerto: item.percentual,
        revisaoAntecipada: antecipadaPorTopico.has(item.topicId),
      };
    })
    .sort((a, b) => a.percentualAcerto - b.percentualAcerto);

  return { acertoPorAssunto, excessoConfianca };
}
