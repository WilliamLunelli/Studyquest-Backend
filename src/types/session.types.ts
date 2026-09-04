import { SessionPreset, SessionStatus, SessionType } from "../generated/prisma/enums";

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
