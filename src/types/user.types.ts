import { GoalListItem } from "./goal.types";

export type RegisterResponse = {
  id: string;
  nome: string;
  email: string;
  token: string;
};

export type MeResponse = {
  id: string;
  nome: string;
  email: string;
  objetivo: GoalListItem | null;
  xpTotal: number;
  nivel: number;
  streakAtual: number;
  onboardingCompleto: boolean;
};

export type LoginResponse = {
  token: string;
  user: {
    id: string;
    nome: string;
    email: string;
    onboardingCompleto: boolean;
  };
};
