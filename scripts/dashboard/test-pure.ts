/**
 * Testes das funções PURAS do dashboard (sem banco de dados).
 * Rodar com: npx tsx scripts/dashboard/test-pure.ts
 */
import {
  calcularPercentual,
  ehExcessoConfianca,
  ehRevisaoAntecipada,
  calcularDuracaoMediaBloco,
  calcularBlocosPlanejados,
  calcularPercentualAderencia,
  diasDesde,
  calcularDiasEfetivos,
} from "../../src/utils/dashboard.utils";

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

console.log("== calcularPercentual: nunca NaN/Infinity ==");

assertEqual("40 de 100 = 40%", calcularPercentual(40, 100), 40);
assertEqual("0 de 0 = 0% (não NaN)", calcularPercentual(0, 0), 0);
assertEqual("Arredonda pra cima em .5", calcularPercentual(1, 3), 33);

console.log("\n== acertoPorAssunto: piso de amostra (>=10 questões) ==");
console.log(
  "   (o piso em si é aplicado no repository via `having`; aqui só se testa",
);
console.log("   o cálculo de percentual que roda sobre o que já passou pelo piso)");

assertEqual("9 questões, 5 acertos = 56%", calcularPercentual(5, 9), 56);
assertEqual("10 questões, 5 acertos = 50%", calcularPercentual(5, 10), 50);

console.log("\n== excessoConfianca: 3+ TRANQUILO E <60% de acerto ==");

assertEqual(
  "2 TRANQUILO com 47% de acerto: NÃO é excesso de confiança (menos de 3)",
  ehExcessoConfianca(2, 47),
  false,
);
assertEqual(
  "3 TRANQUILO com 47% de acerto: É excesso de confiança",
  ehExcessoConfianca(3, 47),
  true,
);
assertEqual(
  "3 TRANQUILO com 61% de acerto: NÃO é excesso de confiança (limite é <60, não <=60)",
  ehExcessoConfianca(3, 61),
  false,
);
assertEqual(
  "3 TRANQUILO com exatamente 60% de acerto: NÃO é excesso de confiança (limite é <60)",
  ehExcessoConfianca(3, 60),
  false,
);
assertEqual(
  "3 TRANQUILO com exatamente 59% de acerto: É excesso de confiança",
  ehExcessoConfianca(3, 59),
  true,
);
assertEqual(
  "10 TRANQUILO (bem acima do piso) com 10% de acerto: É excesso de confiança",
  ehExcessoConfianca(10, 10),
  true,
);

console.log("\n== revisaoAntecipada: mesmo critério de question-log.service (<50%) ==");

assertEqual("5 de 10 (50%): NÃO antecipa (limite é <50, não <=50)", ehRevisaoAntecipada(10, 5), false);
assertEqual("4 de 10 (40%): antecipa", ehRevisaoAntecipada(10, 4), true);
assertEqual("0 questões feitas: não antecipa (sem amostra, não divide por zero)", ehRevisaoAntecipada(0, 0), false);

console.log("\n== diasEfetivos: o ideal escala pelo tempo que a âncora existe, não pelo período pedido ==");

{
  const hoje = new Date("2026-09-06T12:00:00Z");
  assertEqual("Âncora hoje mesmo: 1 dia (nunca 0)", diasDesde(new Date("2026-09-06T03:00:00Z"), hoje), 1);
  assertEqual("Âncora ontem: 2 dias (hoje + ontem)", diasDesde(new Date("2026-09-05T12:00:00Z"), hoje), 2);
  assertEqual("Âncora 20 dias atrás: 21 dias", diasDesde(new Date("2026-08-17T12:00:00Z"), hoje), 21);
  assertEqual(
    "Âncora no futuro (relógio dessincronizado): nunca cai abaixo de 1",
    diasDesde(new Date("2026-09-10T12:00:00Z"), hoje),
    1,
  );

  assertEqual(
    "Conta de 21 dias, período de 90 pedidos: diasEfetivos = 21 (clampa pro que existe)",
    calcularDiasEfetivos(90, new Date("2026-08-17T12:00:00Z"), hoje),
    21,
  );
  assertEqual(
    "Conta de 200 dias, período de 30 pedidos: diasEfetivos = 30 (conta mais velha não estica o período)",
    calcularDiasEfetivos(30, new Date("2026-01-01T12:00:00Z"), hoje),
    30,
  );
}

console.log("\n== aderenciaCiclo: duração média, blocos planejados e percentual ==");

assertEqual("Duração média de [25, 30, 50] = 35", calcularDuracaoMediaBloco([25, 30, 50]), 35);
assertEqual("Duração média de ciclo sem blocos = 0", calcularDuracaoMediaBloco([]), 0);

assertEqual(
  "420 min/semana, período de 7 dias, blocos de 30min = 14 planejados",
  calcularBlocosPlanejados(420, 7, 30),
  14,
);
assertEqual(
  "420 min/semana, período de 30 dias, blocos de 30min = escala proporcional (60 planejados)",
  calcularBlocosPlanejados(420, 30, 30),
  60,
);
assertEqual(
  "Duração média 0 (sem ciclo ativo ou sem blocos): 0 planejados, nunca Infinity",
  calcularBlocosPlanejados(420, 7, 0),
  0,
);

assertEqual("14 planejados, 14 concluídos = 100%", calcularPercentualAderencia(14, 14), 100);
assertEqual("0 planejados: percentual 0, nunca NaN/Infinity", calcularPercentualAderencia(0, 5), 0);
assertEqual(
  "10 planejados, 13 concluídos = 130% (passar de 100 é permitido, não trava)",
  calcularPercentualAderencia(10, 13),
  130,
);

console.log(`\n${falhas === 0 ? "Todos os testes passaram." : `${falhas} teste(s) falharam.`}`);
process.exit(falhas === 0 ? 0 : 1);
