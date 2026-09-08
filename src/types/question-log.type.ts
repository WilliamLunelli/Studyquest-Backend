export type CreateQuestionLogInput = {
  subjectId: string;
  topicId: string;
  feitas: number;
  acertadas: number;
  sessionId?: string;
  data?: Date;
};

export type CreateQuestionLogRepositoryInput = {
  topicId: string;
  feitas: number;
  acertadas: number;
  data: Date;
};

export type CreateQuestionLogResponse = {
  id: string;
  percentualAcerto: number;
  xpGanho: number;
};

export type QuestionLogListFilters = {
  subjectId?: string;
  topicId?: string;
  de?: Date;
  ate?: Date;
  page: number;
  limit: number;
};

export type QuestionLogListQueryInput = {
  subjectId?: unknown;
  topicId?: unknown;
  de?: unknown;
  ate?: unknown;
  page?: unknown;
  limit?: unknown;
};

export type QuestionLogItem = {
  id: string;
  subjectId: string;
  materia: string;
  topicId: string;
  assunto: string;
  feitas: number;
  acertadas: number;
  percentualAcerto: number;
  data: Date;
};

export type QuestionLogListResponse = {
  items: QuestionLogItem[];
  aggregate: {
    feitas: number;
    acertadas: number;
    percentualAcerto: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
