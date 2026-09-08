import { calcularNivel } from "./level.utils";

/**
 * Decaimento por faixa: cada minuto de estudo vale menos XP conforme o
 * total de minutos JÁ estudados no dia (não da sessão isolada) avança.
 * O teto diário é 120*1 + 120*0.7 + 120*0.4 = 252 XP: estudar 8h não
 * rende mais XP que estudar 6h, porque toda faixa acima de 360min vale 0.
 */
const XP_TIERS = [
  { limit: 120, xpPerMinute: 1 },
  { limit: 240, xpPerMinute: 0.7 },
  { limit: 360, xpPerMinute: 0.4 },
];

export const BONUS_ASSUNTO_CONCLUIDO_XP = 200;
export const BONUS_MELHORIA_ACERTO_XP = 300;

/**
 * Amostra mínima (em cada lado da comparação) pra avaliar a melhoria
 * de acerto. Mesmo piso usado no dashboard pra acerto por assunto —
 * sem isso, "antes" com 1-2 questões é ruído estatístico (0% ou 100%),
 * não um sinal real de "assunto ruim".
 */
export const AMOSTRA_MINIMA_MELHORIA_ACERTO = 10;

/**
 * XP de uma sessão cronometrada, fatiando os minutos da sessão pelas
 * faixas de decaimento a partir de onde o dia já estava (minutesAlreadyStudiedToday).
 * O multiplicador (2x pra revisão em dia) é aplicado DEPOIS do decaimento,
 * nunca antes — decair um valor já multiplicado dobraria o teto diário.
 */
export function calculateSessionXp(
  minutesAlreadyStudiedToday: number,
  sessionMinutes: number,
  multiplier: number,
) {
  let remainingMinutes = sessionMinutes;
  let currentMinute = minutesAlreadyStudiedToday;
  let xp = 0;

  for (const tier of XP_TIERS) {
    if (remainingMinutes <= 0) {
      break;
    }

    if (currentMinute >= tier.limit) {
      continue;
    }

    const availableInTier = tier.limit - currentMinute;
    const minutesInTier = Math.min(remainingMinutes, availableInTier);

    xp += minutesInTier * tier.xpPerMinute;
    currentMinute += minutesInTier;
    remainingMinutes -= minutesInTier;
  }

  return Math.round(xp * multiplier);
}

/**
 * Mantida com a mesma assinatura de antes (usada por
 * session.repository.ts no finish) — só troca o loop nível-a-nível
 * por a fórmula fechada de level.utils.ts.
 */
export function calculateLevelFromXp(totalXp: number) {
  return calcularNivel(totalXp).nivel;
}

/**
 * +200 XP, uma única vez por assunto do ciclo, nunca repete. Quem
 * garante o "uma vez" é quem chama isso (checar que o CycleBlock
 * ainda não estava CONCLUIDO antes de conceder) — esta função só
 * devolve o valor do bônus.
 */
export function calcularBonusAssuntoConcluido(): number {
  return BONUS_ASSUNTO_CONCLUIDO_XP;
}

export type AcertoAgregado = {
  feitas: number;
  acertadas: number;
};

/**
 * +300 XP quando o acerto por assunto sai de <50% para >70%. Avaliado
 * a cada QuestionLog novo, comparando o histórico completo do assunto
 * antes e depois de gravar o registro atual (não uma janela de tempo —
 * mais simples e menos gamejável que resetar via período).
 *
 * Exige pelo menos AMOSTRA_MINIMA_MELHORIA_ACERTO questões dos DOIS
 * lados da comparação: sem o piso no "antes", 1-2 questões erradas já
 * contam como "<50%" sem nenhum valor estatístico real.
 */
export function calcularBonusMelhoriaAcerto(
  antes: AcertoAgregado,
  depois: AcertoAgregado,
): number {
  if (
    antes.feitas < AMOSTRA_MINIMA_MELHORIA_ACERTO ||
    depois.feitas < AMOSTRA_MINIMA_MELHORIA_ACERTO
  ) {
    return 0;
  }

  const percentualAntes = (antes.acertadas / antes.feitas) * 100;
  const percentualDepois = (depois.acertadas / depois.feitas) * 100;

  const saiuDeRuim = percentualAntes < 50;
  const chegouBom = percentualDepois > 70;

  return saiuDeRuim && chegouBom ? BONUS_MELHORIA_ACERTO_XP : 0;
}
