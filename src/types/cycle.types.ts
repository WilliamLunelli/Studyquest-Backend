export type CreateCycleBlockInput = {
  ordem: number;
  duracao: number;
  subjectId: string;
  topicId: string | null;
};

export type CycleBlockResponse = {
  id: string;
  ordem: number;
  subjectId: string;
  materia: string;
  topicId: string | null;
  assunto: string | null;
  duracaoMin: number;
  status: "pendente" | "concluido";
};

export type CreateCycleResponse = {
  id: string;
  geradoEm: Date;
  posicaoAtual: number;
  blocos: CycleBlockResponse[];
};

export type CompleteCycleResponse = {
  bloco: {
    id: string;
    ordem: number;
    subjectId: string;
    materia: string;
    topicId: string | null;
    assunto: string | null;
    duracaoMin: number;
    status: "pendente" | "concluído";
  };
  xpGanho: number;
};

export type UpdateCycleBlockInput = {
  ordem?: number;
  duracaoMin?: number;
  subjectId?: string;
  topicId?: string | null;
};

export type CycleAlignmentItem = {
  subjectId: string;
  materia: string;
  peso: number;
  minutosIdeaisSemana: number;
  minutosReaisSemana: number;
  desvioPercentual: number;
  status: "abaixo" | "ok" | "acima";
};

export type CycleAlignmentResponse = CycleAlignmentItem[];
