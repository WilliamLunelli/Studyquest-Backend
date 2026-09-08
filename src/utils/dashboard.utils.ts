/** Mesmo piso usado no bônus de melhoria de acerto (xp.utils.ts) — sem
 * amostra mínima, poucas questões produzem percentuais extremos (0% ou
 * 100%) que não significam nada estatisticamente. */
export const AMOSTRA_MINIMA_ACERTO = 10;

export const MINIMO_AUTOAVALIACOES_TRANQUILO = 3;

/** Corte de "excesso de confiança" no dashboard. Diferente do limiar de
 * antecipação de revisão (ver LIMIAR_REVISAO_ANTECIPADA) — este é só o
 * corte usado pra destacar o insight, não altera nenhum agendamento. */
export const LIMIAR_EXCESSO_CONFIANCA = 60;

/** Mesmo limiar usado por question-log.service.ts pra decidir antecipar a
 * revisão (regra de domínio 5: dado objetivo vence autoavaliação). */
export const LIMIAR_REVISAO_ANTECIPADA = 50;

/** Percentual arredondado de numerador/denominador. 0 quando o
 * denominador é 0 — nunca NaN nem Infinity. */
export function calcularPercentual(numerador: number, denominador: number): number {
  if (denominador === 0) {
    return 0;
  }

  return Math.round((numerador / denominador) * 100);
}

export function ehExcessoConfianca(
  autoavaliacoesTranquilo: number,
  percentualAcerto: number,
): boolean {
  return (
    autoavaliacoesTranquilo >= MINIMO_AUTOAVALIACOES_TRANQUILO &&
    percentualAcerto < LIMIAR_EXCESSO_CONFIANCA
  );
}

/** Mesmo critério de question-log.service.ts (shouldAnticipateReview),
 * reaplicado aqui em cima do registro bruto — não dá pra derivar isso do
 * agregado do período, porque a regra real olha cada registro. */
export function ehRevisaoAntecipada(feitas: number, acertadas: number): boolean {
  if (feitas === 0) {
    return false;
  }

  return (acertadas / feitas) * 100 < LIMIAR_REVISAO_ANTECIPADA;
}

/**
 * Dias corridos entre a meia-noite de `ancora` e o fim do dia de hoje
 * (amanhã 00h) — inclui o próprio dia da âncora. Nunca menor que 1 (uma
 * âncora hoje, ou no futuro por algum relógio dessincronizado, ainda
 * conta como 1 dia — nunca 0 ou negativo).
 */
export function diasDesde(ancora: Date, agora: Date = new Date()): number {
  const inicioAncora = new Date(ancora);
  inicioAncora.setHours(0, 0, 0, 0);

  const fimHoje = new Date(agora);
  fimHoje.setHours(0, 0, 0, 0);
  fimHoje.setDate(fimHoje.getDate() + 1);

  const dias = Math.round((fimHoje.getTime() - inicioAncora.getTime()) / 86400000);
  return Math.max(1, dias);
}

/**
 * Quantos dias do `periodoDias` pedido a `ancora` realmente cobre.
 *
 * O "ideal" do dashboard (minutos ideais, blocos planejados) escala pelo
 * tempo em que a conta — ou o ciclo, dependendo do que está sendo medido
 * — de fato existiu, NUNCA pelo periodoDias bruto do query param. Sem
 * este clamp, uma conta de 20 dias consultada com periodo=90d compara
 * o real (só podia ter 20 dias de dado) contra um ideal calculado para
 * 90 dias inteiros, e sai "abaixo" mesmo cumprindo a meta todo santo
 * dia desde que a conta existe. NÃO troque de volta para o periodoDias
 * cru achando que isso é redundante — é o comportamento intencional que
 * corrige essa distorção.
 */
export function calcularDiasEfetivos(
  periodoDias: number,
  ancora: Date,
  agora: Date = new Date(),
): number {
  return Math.min(periodoDias, diasDesde(ancora, agora));
}

export function calcularDuracaoMediaBloco(duracoes: number[]): number {
  if (duracoes.length === 0) {
    return 0;
  }

  return duracoes.reduce((soma, duracao) => soma + duracao, 0) / duracoes.length;
}

/**
 * blocosPlanejados = minutos disponíveis no período / duração média dos
 * blocos do ciclo ativo. 0 quando não há ciclo ativo (ou ele não tem
 * blocos) em vez de dividir por zero.
 */
export function calcularBlocosPlanejados(
  minutosDisponiveisSemana: number,
  periodoDias: number,
  duracaoMediaBloco: number,
): number {
  if (duracaoMediaBloco <= 0) {
    return 0;
  }

  const minutosPeriodo = minutosDisponiveisSemana * (periodoDias / 7);
  return Math.round(minutosPeriodo / duracaoMediaBloco);
}

/**
 * Percentual de aderência = concluídos / planejados. 0 quando não há
 * blocos planejados (nunca NaN/Infinity). Pode passar de 100 — cumprir
 * mais blocos do que o planejado é informação válida, não um erro.
 */
export function calcularPercentualAderencia(
  blocosPlanejados: number,
  blocosConcluidos: number,
): number {
  if (blocosPlanejados <= 0) {
    return 0;
  }

  return Math.round((blocosConcluidos / blocosPlanejados) * 100);
}
