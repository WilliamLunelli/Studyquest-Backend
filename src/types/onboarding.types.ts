import { GoalListItem, GoalWeightItem } from "./goal.types";

export type SetGoalResponse = {
  objetivo: GoalListItem;
  pesos: GoalWeightItem[];
};

export type AvailabilityDay = { diaSemana: number; minutos: number };

export type SetAvailabilityResponse = {
  disponibilidade: AvailabilityDay[];
};

export type DifficultyInput = { subjectId: string; nivel: number };

export type SetDifficultiesResponse = {
  dificuldades: DifficultyInput[];
};
