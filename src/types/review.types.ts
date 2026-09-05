import { SelfRating } from "../generated/prisma/enums";

export type ReviewTodayItem = {
  reviewId: string;
  subjectId: string;
  materia: string;
  topicId: string;
  assunto: string;
  agendadaPara: Date;
  atrasadaEmDias: number;
  repeticao: number;
  multiplicadorXp: 1 | 2;
};

export type ReviewDetailResponse = {
  reviewId: string;
  materia: string;
  assunto: string;
  repeticao: number;
  roteiro: {
    aviso: string;
    prompts: string[];
  };
  ultimaSessao: {
    data: Date;
    autoavaliacao: SelfRating | null;
    minutos: number;
  } | null;
};

export type ReviewUpcomingQueryInput = {
  dias?: unknown;
};

export type ReviewUpcomingItem = ReviewTodayItem;
