import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwt";
import { LoginResponse, MeResponse, RegisterResponse } from "../types/user.types";
import { userRepository } from "../repositories/user.repository";
import { AppError } from "../utils/app-error";
import { toGoalSummary } from "./goal.service";

export async function createUser(
  email: string,
  username: string,
  password: string,
): Promise<RegisterResponse> {
  const existingUser = await userRepository.findByEmail(email);

  if (existingUser) {
    throw new AppError(409, "E-mail já cadastrado.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await userRepository.create({
    email,
    username,
    password: hashedPassword,
  });

  const token = generateToken(user.id);

  return {
    id: user.id,
    nome: user.username,
    email: user.email,
    token,
  };
}

/**
 * Onboarding completo = objetivo definido + todas as matérias do
 * objetivo avaliadas (dificuldade preenchida, não o valor 0 default)
 * + disponibilidade preenchida nos 7 dias da semana.
 *
 * Função própria porque login, GET /auth/me e GET /home vão precisar
 * do mesmo cálculo — extrair evita recalcular a regra em três lugares.
 */
export async function checkOnboardingStatus(userId: string): Promise<boolean> {
  const user = await userRepository.findById(userId);

  // Guard clause: sem objetivo não tem o que comparar, então nem
  // vale rodar as três contagens.
  if (!user || !user.goalId) {
    return false;
  }

  const [filledDifficulties, totalSubjects, availabilityDays] =
    await Promise.all([
      userRepository.countFilledDifficulties(userId),
      userRepository.countSubjectsForGoal(user.goalId),
      userRepository.countAvailabilityDays(userId),
    ]);

  // totalSubjects > 0 evita um falso positivo: se por algum motivo o
  // objetivo não tiver matérias, "0 preenchidas === 0 no total" não
  // pode contar como onboarding completo.
  return (
    totalSubjects > 0 &&
    filledDifficulties === totalSubjects &&
    availabilityDays === 7
  );
}

export async function getMe(userId: string): Promise<MeResponse> {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new AppError(401, "Usuário não encontrado.");
  }

  const onboardingCompleto = await checkOnboardingStatus(userId);

  return {
    id: user.id,
    nome: user.username,
    email: user.email,
    objetivo: user.goal ? toGoalSummary(user.goal) : null,
    xpTotal: user.xpTotal,
    nivel: user.level,
    streakAtual: user.streakAtual,
    onboardingCompleto,
  };
}

export async function loginUser(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const user = await userRepository.findByEmail(email);

  // Mesma mensagem e mesmo status para "e-mail não existe" e "senha
  // errada" — não dá pra revelar qual dos dois motivos causou a falha.
  if (!user) {
    throw new AppError(401, "E-mail ou senha inválidos.");
  }

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    throw new AppError(401, "E-mail ou senha inválidos.");
  }

  const onboardingCompleto = await checkOnboardingStatus(user.id);

  const token = generateToken(user.id);

  return {
    token,
    user: {
      id: user.id,
      nome: user.username,
      email: user.email,
      onboardingCompleto,
    },
  };
}
