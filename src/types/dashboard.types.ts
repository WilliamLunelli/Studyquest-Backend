import { CycleAlignmentItem } from "./cycle.types";

export const DASHBOARD_PERIODOS = ["7d", "30d", "90d"] as const;
export type DashboardPeriodo = (typeof DASHBOARD_PERIODOS)[number];

export type DashboardQueryInput = {
  periodo?: unknown;
};

export type CoberturaResumo = {
  assuntosTotais: number;
  assuntosVistos: number;
  percentual: number;
};

export type AcertoPorAssuntoItem = {
  topicId: string;
  assunto: string;
  materia: string;
  feitas: number;
  acertadas: number;
  percentual: number;
};

export type ExcessoConfiancaItem = {
  topicId: string;
  assunto: string;
  materia: string;
  autoavaliacoesTranquilo: number;
  percentualAcerto: number;
  revisaoAntecipada: boolean;
};

export type StreakResumo = {
  atual: number;
  recorde: number;
  escudosDisponiveis: number;
};

export type AderenciaCicloResumo = {
  blocosPlanejados: number;
  blocosConcluidos: number;
  percentual: number;
};

export type DashboardResponse = {
  cobertura: CoberturaResumo;
  horasPorMateria: CycleAlignmentItem[];
  acertoPorAssunto: AcertoPorAssuntoItem[];
  excessoConfianca: ExcessoConfiancaItem[];
  streak: StreakResumo;
  aderenciaCiclo: AderenciaCicloResumo;
};
