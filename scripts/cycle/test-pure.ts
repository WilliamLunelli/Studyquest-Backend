/**
 * Testes das funções PURAS do ciclo de estudos (sem banco de dados).
 * Rodar com: npx tsx scripts/cycle/test-pure.ts
 */
import {
  ajustarScoresSemInverterPesos,
  calcularScoreMateria,
  classificarAderencia,
  DIFICULDADE_NEUTRA,
} from "../../src/utils/cycle-score.utils";
import { fatiarEmBlocos, intercalarBlocos } from "../../src/utils/cycle";
import { CreateCycleBlockInput } from "../../src/types/cycle.types";

let falhas = 0;

function assertEqual(descricao: string, obtido: unknown, esperado: unknown) {
  const passou = JSON.stringify(obtido) === JSON.stringify(esperado);
  console.log(`${passou ? "OK  " : "FALHOU"} - ${descricao}`);
  if (!passou) {
    falhas++;
    console.log(`       esperado: ${JSON.stringify(esperado)}`);
    console.log(`       obtido:   ${JSON.stringify(obtido)}`);
  }
}

function assertTrue(descricao: string, condicao: boolean) {
  assertEqual(descricao, condicao, true);
}

console.log("== Geração: fórmula peso x (1 + (dificuldade - 3) x 0,15) ==");

assertEqual("peso 2, dificuldade neutra (3) = 2 (sem ajuste)", calcularScoreMateria(2, 3), 2);
assertEqual(
  "peso 2, dificuldade 5 (máxima) = 2 x 1.3 = 2.6 (+30%)",
  Math.round(calcularScoreMateria(2, 5) * 100) / 100,
  2.6,
);
assertEqual(
  "peso 2, dificuldade 1 (mínima) = 2 x 0.7 = 1.4 (-30%)",
  Math.round(calcularScoreMateria(2, 1) * 100) / 100,
  1.4,
);

console.log("\n== Geração: dificuldade ausente usa 3 (neutro) ==");
assertEqual("DIFICULDADE_NEUTRA = 3", DIFICULDADE_NEUTRA, 3);
assertEqual(
  "Score com dificuldade ausente (fallback DIFICULDADE_NEUTRA) = peso puro",
  calcularScoreMateria(4, DIFICULDADE_NEUTRA),
  4,
);

console.log("\n== Geração: ajustarScoresSemInverterPesos (anti-inversão) ==");

{
  // Pedido: dificuldade 5 numa matéria de peso 1 não ultrapassa uma de peso 3.
  // Matematicamente já não ultrapassaria mesmo sem a função (peso domina o
  // ±30% da dificuldade), mas o teste documenta a garantia fim a fim.
  const scores = [
    { subjectId: "peso1-dificil", peso: 1, score: calcularScoreMateria(1, 5) },
    { subjectId: "peso3-facil", peso: 3, score: calcularScoreMateria(3, 1) },
  ];
  const ajustado = ajustarScoresSemInverterPesos(scores);
  assertTrue(
    "Peso 1 (dificuldade 5) não ultrapassa peso 3 (mesmo fácil)",
    ajustado.get("peso1-dificil")! <= ajustado.get("peso3-facil")!,
  );
}

{
  // Caso onde a inversão aconteceria SEM a correção: pesos próximos
  // (1 vs 1.5) fazem o +30% de dificuldade da matéria mais leve (1.3)
  // superar o -30% da mais pesada (1.5*0.7=1.05) — aqui a função
  // realmente precisa agir, não é só uma verdade trivial da aritmética.
  const scores = [
    { subjectId: "leve-dificil", peso: 1, score: calcularScoreMateria(1, 5) }, // 1.3
    { subjectId: "pesado-facil", peso: 1.5, score: calcularScoreMateria(1.5, 1) }, // 1.05
  ];
  assertTrue(
    "Sem correção, essa combinação de pesos próximos realmente inverteria",
    scores[0]!.score > scores[1]!.score,
  );

  const ajustado = ajustarScoresSemInverterPesos(scores);
  assertTrue(
    "Com a correção, peso menor (1) não ultrapassa peso maior (1.5)",
    ajustado.get("leve-dificil")! <= ajustado.get("pesado-facil")!,
  );
}

console.log("\n== Geração: fatiarEmBlocos — todo bloco entre 25 e 60 minutos ==");

{
  let algumForaDaFaixa = false;
  const totaisTestados = [24, 25, 30, 59, 60, 61, 90, 100, 121, 130, 245, 517];

  for (const minutos of totaisTestados) {
    const blocos = fatiarEmBlocos(minutos);

    for (const duracao of blocos) {
      if (duracao < 25 || duracao > 60) {
        algumForaDaFaixa = true;
        console.log(`  bloco fora da faixa: ${duracao}min (total testado: ${minutos}min)`);
      }
    }
  }

  assertEqual("Nenhum bloco gerado fica fora de 25-60 min (vários totais testados)", algumForaDaFaixa, false);
}

assertEqual("Menos de 25 min não gera bloco nenhum (24min = [])", fatiarEmBlocos(24), []);
assertEqual("Exatamente 25 min = 1 bloco de 25", fatiarEmBlocos(25), [25]);
assertEqual("Exatamente 60 min = 1 bloco de 60", fatiarEmBlocos(60), [60]);

console.log("\n== Geração: intercalarBlocos — não repete matéria em sequência ==");

{
  function bloco(subjectId: string, ordem: number): CreateCycleBlockInput {
    return { ordem, duracao: 30, subjectId, topicId: null };
  }

  // 3 blocos de A, 3 de B, 2 de C: nenhuma matéria passa de metade do
  // total (condição pra dar pra intercalar sem nenhuma repetição
  // consecutiva — com uma matéria maioria absoluta isso é impossível
  // por contagem, não é sobre o algoritmo).
  const blocks = [
    bloco("A", 1),
    bloco("A", 2),
    bloco("A", 3),
    bloco("B", 4),
    bloco("B", 5),
    bloco("B", 6),
    bloco("C", 7),
    bloco("C", 8),
  ];

  const resultado = intercalarBlocos(blocks);
  let algumaRepeticaoConsecutiva = false;

  for (let i = 1; i < resultado.length; i++) {
    if (resultado[i]!.subjectId === resultado[i - 1]!.subjectId) {
      algumaRepeticaoConsecutiva = true;
      console.log(`  repetição consecutiva na posição ${i}: ${resultado[i]!.subjectId}`);
    }
  }

  assertEqual(
    "Nenhum par de blocos consecutivos tem a mesma matéria (com 3 matérias disponíveis)",
    algumaRepeticaoConsecutiva,
    false,
  );
  assertEqual("intercalarBlocos preserva a quantidade total de blocos", resultado.length, blocks.length);
}

console.log("\n== Alignment: classificarAderencia ==");

assertEqual("69% do ideal = abaixo (< 70%)", classificarAderencia(100, 69), "abaixo");
assertEqual("70% do ideal = ok (limite não é abaixo)", classificarAderencia(100, 70), "ok");
assertEqual("100% do ideal = ok", classificarAderencia(100, 100), "ok");
assertEqual("130% do ideal = ok (limite não é acima)", classificarAderencia(100, 130), "ok");
assertEqual("131% do ideal = acima (> 130%)", classificarAderencia(100, 131), "acima");

console.log(`\n${falhas === 0 ? "Todos os testes passaram." : `${falhas} teste(s) falharam.`}`);
process.exit(falhas === 0 ? 0 : 1);
