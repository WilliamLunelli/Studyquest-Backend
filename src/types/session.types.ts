import {
  SelfRating,
  SessionPreset,
  SessionStatus,
  SessionType,
} from "../generated/prisma/enums";

export type CreateSessionInput = {
  blocoId?: string;
  subjectId: string;
  topicId: string;
  tipo: SessionType;
  preset: SessionPreset;
  duracaoAlvoMin?: number;
  reviewId?: string;
};

export type SessionResponse = {
  id: string;
  startedAt: Date;
  duracaoAlvoMin: number | null;
  preset: SessionPreset;
  tipo: SessionType;
  status: SessionStatus;
};

export type ActiveSessionResponse = SessionResponse & {
  minutosAcumulados: number;
};

export type PauseResumeResponse = {
  id: string;
  status: SessionStatus;
  minutosAcumulados: number;
};

export type FinishSessionInput = {
  autoavaliacao: "travei" | "ok" | "tranquilo";
  nota?: string;
};

export type FinishSessionRepositoryInput = {
  selfRating: SelfRating;
  notes?: string;
};

export type FinishSessionResponse = {
  sessao: {
    id: string;
    minutosTotais: number;
    tipo: SessionType;
    finishedAt: Date;
  };
  xp: {
    ganho: number;
    multiplicador: number;
    total: number;
    nivelAnterior: number;
    nivelAtual: number;
    subiuDeNivel: boolean;
  };
  streak: {
    atual: number;
    metaCumprida: boolean;
    escudoUsado: boolean;
  };
  proximaRevisao: {
    reviewId: string | null;
    agendadaPara: Date | null;
    intervaloDias: number | null;
  };
  proximoBloco: {
    blocoId: string | null;
    materia: string | null;
    assunto: string | null;
    duracaoMin: number | null;
  };
};
