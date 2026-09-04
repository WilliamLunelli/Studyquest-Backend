import { CreateCycleBlockInput } from "../types/cycle.types";

export function fatiarEmBlocos(minutos: number) {
  if (minutos < 25) return [];

  const quantidadeBlocos = Math.ceil(minutos / 60);
  const duracaoBase = Math.floor(minutos / quantidadeBlocos);
  let resto = minutos - duracaoBase * quantidadeBlocos;

  const blocos = [];

  for (let i = 0; i < quantidadeBlocos; i++) {
    let duracao = duracaoBase;

    if (resto > 0) {
      duracao++;
      resto--;
    }

    blocos.push(duracao);
  }

  return blocos;
}

export function intercalarBlocos(blocks: CreateCycleBlockInput[]) {
  const blocosPorMateria = new Map<string, CreateCycleBlockInput[]>();

  blocks.forEach((block) => {
    const lista = blocosPorMateria.get(block.subjectId) ?? [];

    lista.push(block);

    blocosPorMateria.set(block.subjectId, lista);
  });

  const resultado: CreateCycleBlockInput[] = [];
  let ultimaMateria: string | null = null;

  while ([...blocosPorMateria.values()].some((lista) => lista.length > 0)) {
    const materiasDisponiveis = [...blocosPorMateria.entries()]
      .filter(([subjectId, lista]) => {
        return subjectId !== ultimaMateria && lista.length > 0;
      })
      .sort((a, b) => {
        return b[1].length - a[1].length;
      });

    const materiaEscolhida = materiasDisponiveis[0];

    // TODO criar fallback para nao perder blocos quando so sobra a mesma materia da ultima rodada.
    if (!materiaEscolhida) {
      break;
    }

    const [subjectId, lista] = materiaEscolhida;

    const bloco = lista.shift();

    if (!bloco) {
      break;
    }

    resultado.push(bloco);
    ultimaMateria = subjectId;
  }

  return resultado.map((bloco, index) => {
    return {
      ...bloco,
      ordem: index + 1,
    };
  });
}
