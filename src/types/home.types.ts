export type HomeResponse = {
  proximoBloco: {
    blocoId: string;
    materia: string;
    assunto: string | null;
    duracaoMin: number;
    tipoSugerido: "teoria" | "questoes" | "revisao";
  };
  revisoesHoje: {
    reviewId: string;
    materia: string;
    assunto: string;
    agendadaPara: Date;
    multiplicadorXp: 1 | 2;
    atrasada: boolean;
  }[];
  streak: {
    atual: number;
    recorde: number;
    escudosDisponiveis: number;
    metaDiariaMin: number;
    minutosHoje: number;
    metaCumprida: boolean;
  };
  xp: {
    total: number;
    nivel: number;
    titulo: string;
    xpNoNivel: number;
    xpParaProximoNivel: number;
  };
  estudandoAgora: number;
};
