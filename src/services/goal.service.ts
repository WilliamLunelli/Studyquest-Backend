import { goalRepository } from "../repositories/goal.repository";
import { AppError } from "../utils/app-error";
import { GoalType } from "../generated/prisma/enums";
import { GoalListItem, GoalWeightItem } from "../types/goal.types";

const TIPO_QUERY_MAP: Record<string, GoalType> = {
  enem: GoalType.ENEM,
  concurso: GoalType.CONCURSO,
};

// Reaproveitada em GET /auth/me e PUT /me/goal — mesmo formato de
// "objetivo" em todo lugar que expõe um Goal.
export function toGoalSummary(goal: {
  id: string;
  type: GoalType;
  nome: string;
  universidade: string | null;
  banca: string | null;
}): GoalListItem {
  return {
    id: goal.id,
    tipo: goal.type,
    nome: goal.nome,
    // instituicao: universidade pro ENEM, banca pro concurso.
    instituicao: goal.universidade ?? goal.banca ?? null,
  };
}

export async function listGoals(tipo?: string): Promise<GoalListItem[]> {
  let type: GoalType | undefined;

  if (tipo !== undefined) {
    const normalized = TIPO_QUERY_MAP[tipo.toLowerCase()];

    if (!normalized) {
      throw new AppError(
        422,
        "Parâmetro 'tipo' inválido. Use 'enem' ou 'concurso'.",
      );
    }

    type = normalized;
  }

  const goals = await goalRepository.findMany(type);

  return goals.map(toGoalSummary);
}

// Reaproveitada em PUT /me/goal, que devolve os pesos junto do objetivo.
export function toGoalWeightItems(
  weights: Awaited<ReturnType<typeof goalRepository.findWeightsByGoalId>>,
): GoalWeightItem[] {
  return weights.map((weight) => ({
    areaId: weight.area.id,
    area: weight.area.nome,
    peso: weight.peso,
    subjects: weight.area.subjects.map((subject) => ({
      id: subject.id,
      nome: subject.nome,
    })),
  }));
}

export async function getGoalWeights(goalId: string): Promise<GoalWeightItem[]> {
  const goal = await goalRepository.findById(goalId);

  if (!goal) {
    throw new AppError(404, "Objetivo não encontrado.");
  }

  const weights = await goalRepository.findWeightsByGoalId(goalId);

  return toGoalWeightItems(weights);
}
