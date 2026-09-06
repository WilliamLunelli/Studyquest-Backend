export const DIFICULDADE_NEUTRA = 3;

export type ScoreItem = {
  subjectId: string;
  peso: number;
  score: number;
};

/**
 * score(subject) = peso(area) x (1 + (dificuldade(subject) - 3) x 0,15).
 * Dificuldade 3 (neutra, ou ausente — ver DIFICULDADE_NEUTRA) não
 * ajusta nada: o score fica igual ao peso puro. O ajuste vai de -30%
 * (dificuldade 1) a +30% (dificuldade 5).
 */
export function calcularScoreMateria(peso: number, dificuldade: number): number {
  return peso * (1 + (dificuldade - DIFICULDADE_NEUTRA) * 0.15);
}

/**
 * Garante que a dificuldade nunca inverte a ordem definida pelo peso
 * do objetivo: nenhuma matéria de peso menor pode terminar com score
 * ajustado maior que o menor score já visto num grupo de peso maior.
 * Agrupa por peso (do maior pro menor) e capa cada grupo no teto do
 * grupo anterior.
 */
export function ajustarScoresSemInverterPesos(
  scores: ScoreItem[],
): Map<string, number> {
  const scoreAjustadoPorMateria = new Map<string, number>();
  const scoresPorPeso = [...scores].sort((a, b) => {
    return b.peso - a.peso;
  });
  let menorScorePesoMaior = Infinity;

  for (let index = 0; index < scoresPorPeso.length; ) {
    const primeiroItemDoGrupo = scoresPorPeso[index];

    if (!primeiroItemDoGrupo) {
      break;
    }

    const pesoAtual = primeiroItemDoGrupo.peso;
    const grupoMesmoPeso: ScoreItem[] = [];

    while (index < scoresPorPeso.length) {
      const item = scoresPorPeso[index];

      if (!item || item.peso !== pesoAtual) {
        break;
      }

      grupoMesmoPeso.push(item);
      index++;
    }

    grupoMesmoPeso.forEach((item) => {
      scoreAjustadoPorMateria.set(
        item.subjectId,
        Math.min(item.score, menorScorePesoMaior),
      );
    });

    menorScorePesoMaior = Math.min(
      menorScorePesoMaior,
      ...grupoMesmoPeso.map((item) => {
        return scoreAjustadoPorMateria.get(item.subjectId) ?? item.score;
      }),
    );
  }

  return scoreAjustadoPorMateria;
}

export type StatusAderencia = "abaixo" | "ok" | "acima";

/**
 * <70% do ideal = abaixo, >130% = acima, senão ok. Extraído do
 * cálculo de alinhamento pra poder testar as bordas sem precisar de
 * onboarding + sessões reais.
 */
export function classificarAderencia(
  minutosIdeaisSemana: number,
  minutosReaisSemana: number,
): StatusAderencia {
  if (minutosReaisSemana < minutosIdeaisSemana * 0.7) {
    return "abaixo";
  }

  if (minutosReaisSemana > minutosIdeaisSemana * 1.3) {
    return "acima";
  }

  return "ok";
}
