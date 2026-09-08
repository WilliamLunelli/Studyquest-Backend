export type GoalListItem = {
  id: string;
  tipo: string;
  nome: string;
  instituicao: string | null;
};

export type GoalWeightItem = {
  areaId: string;
  area: string;
  peso: number;
  subjects: { id: string; nome: string }[];
};
