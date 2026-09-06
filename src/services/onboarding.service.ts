import { goalRepository } from "../repositories/goal.repository";
import { userRepository } from "../repositories/user.repository";
import { userDifficultyRepository } from "../repositories/user-difficulty.repository";
import { userAvailabilityRepository } from "../repositories/user-availability.repository";
import { studyCycleRepository } from "../repositories/study-cycle.repository";
import { AppError } from "../utils/app-error";
import { toGoalSummary, toGoalWeightItems } from "./goal.service";
import {
  AvailabilityDay,
  DifficultyInput,
  SetAvailabilityResponse,
  SetDifficultiesResponse,
  SetGoalResponse,
} from "../types/onboarding.types";

export async function setGoal(
  userId: string,
  goalId: string,
): Promise<SetGoalResponse> {
  const goal = await goalRepository.findById(goalId);

  if (!goal) {
    throw new AppError(404, "Objetivo não encontrado.");
  }

  const weights = await goalRepository.findWeightsByGoalId(goalId);
  const subjectIds = weights.flatMap((weight) =>
    weight.area.subjects.map((subject) => subject.id),
  );

  await userRepository.setGoal(userId, goalId);

  // Zera a dificuldade de cada matéria do objetivo (0 = "não
  // respondido") pra o usuário avaliar depois em PUT /me/difficulties.
  if (subjectIds.length > 0) {
    await userDifficultyRepository.createManyZeroed(userId, subjectIds);
  }

  // O ciclo é montado em cima do peso de área do objetivo (Goal ->
  // GoalWeight -> Area -> Subject): trocar de objetivo invalida
  // qualquer ciclo baseado no peso antigo. Só desativa aqui — quem
  // gera o próximo é POST /cycles/generate.
  await studyCycleRepository.invalidateActiveCycle(userId);

  return {
    objetivo: toGoalSummary(goal),
    pesos: toGoalWeightItems(weights),
  };
}

export async function setAvailability(
  userId: string,
  disponibilidade: AvailabilityDay[],
): Promise<SetAvailabilityResponse> {
  await userAvailabilityRepository.replaceAll(userId, disponibilidade);

  return { disponibilidade };
}

export async function setDifficulties(
  userId: string,
  dificuldades: DifficultyInput[],
): Promise<SetDifficultiesResponse> {
  const user = await userRepository.findById(userId);

  // 409: não é "dado inválido", é o usuário tentando pular uma etapa
  // do onboarding fora de ordem.
  if (!user || !user.goalId) {
    throw new AppError(409, "Defina um objetivo antes de avaliar as matérias.");
  }

  const weights = await goalRepository.findWeightsByGoalId(user.goalId);
  const requiredSubjectIds = new Set(
    weights.flatMap((weight) => weight.area.subjects.map((subject) => subject.id)),
  );

  const hasForeignSubject = dificuldades.some(
    (item) => !requiredSubjectIds.has(item.subjectId),
  );
  if (hasForeignSubject) {
    throw new AppError(422, "Uma ou mais matérias não pertencem ao objetivo atual.");
  }

  const providedSubjectIds = new Set(dificuldades.map((item) => item.subjectId));
  const isMissingSubject = [...requiredSubjectIds].some(
    (id) => !providedSubjectIds.has(id),
  );
  if (isMissingSubject) {
    throw new AppError(422, "Todas as matérias do objetivo precisam de um nível.");
  }

  await userDifficultyRepository.updateMany(userId, dificuldades);

  return { dificuldades };
}
