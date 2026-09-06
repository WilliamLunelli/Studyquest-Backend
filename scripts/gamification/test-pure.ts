/**
 * Testes das funções PURAS de gamificação (sem banco de dados).
 * Rodar com: npx tsx scripts/gamification/test-pure.ts
 */
import {
  calculateSessionXp,
  calculateLevelFromXp,
  calcularBonusAssuntoConcluido,
  calcularBonusMelhoriaAcerto,
} from "../../src/utils/xp.utils";
import { calcularNivel, xpAcumuladoParaNivel } from "../../src/utils/level.utils";
import { avaliarDiasFalhosRetroativo, DiaStreak } from "../../src/services/gamification.service";

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

console.log("== XP de sessão (decaimento) ==");

// 300 min (5h) sem minutos prévios: 120*1.0 + 120*0.7 + 60*0.4 = 120+84+24 = 228.
assertEqual(
  "Sessão de 5h (300 min), 0 min prévios = 228 XP",
  calculateSessionXp(0, 300, 1),
  228,
);

// 3h reais (180 min) sem minutos prévios: 120*1.0 + 60*0.7 = 120+42 = 162.
assertEqual(
  "Sessão de 3h (180 min), 0 min prévios = 162 XP",
  calculateSessionXp(0, 180, 1),
  162,
);

assertEqual(
  "60 min de sessão com 100 min prévios = 48 XP",
  calculateSessionXp(100, 60, 1),
  48,
);

assertEqual(
  "8h (480min) em um único dia não rende mais XP que 6h (360min): ambos batem no teto 252",
  calculateSessionXp(0, 480, 1),
  calculateSessionXp(0, 360, 1),
);
assertEqual("Teto diário é 252 XP", calculateSessionXp(0, 480, 1), 252);

assertEqual(
  "Revisão concluída no prazo gera exatamente o dobro (multiplicador 2x, aplicado depois do decaimento)",
  calculateSessionXp(0, 60, 2),
  calculateSessionXp(0, 60, 1) * 2,
);

console.log("\n== Bônus fixos ==");
assertEqual("Bônus de assunto concluído = 200", calcularBonusAssuntoConcluido(), 200);

assertEqual(
  "Melhoria de acerto (40% -> 80%, amostra grande dos dois lados) = 300",
  calcularBonusMelhoriaAcerto({ feitas: 100, acertadas: 40 }, { feitas: 200, acertadas: 160 }),
  300,
);
assertEqual(
  "Sem bônus se não cruzou as duas bordas (60% -> 80%)",
  calcularBonusMelhoriaAcerto({ feitas: 100, acertadas: 60 }, { feitas: 200, acertadas: 160 }),
  0,
);
assertEqual(
  "Sem bônus se não passou de 70% (40% -> 65%)",
  calcularBonusMelhoriaAcerto({ feitas: 100, acertadas: 40 }, { feitas: 200, acertadas: 130 }),
  0,
);

// Piso de amostra: "antes" com só 9 questões não é avaliável, mesmo
// que a matemática do percentual (33% -> 75%) pareça uma virada boa.
assertEqual(
  "Antes com 9 questões (< piso de 10): NÃO concede mesmo com números favoráveis",
  calcularBonusMelhoriaAcerto({ feitas: 9, acertadas: 3 }, { feitas: 20, acertadas: 15 }),
  0,
);

// Bordas exatas do limite <50 / >70 — >=10 dos dois lados em todos os casos.
assertEqual(
  "Virada de exatamente 49% para 71%: concede (49<50 e 71>70)",
  calcularBonusMelhoriaAcerto({ feitas: 100, acertadas: 49 }, { feitas: 200, acertadas: 142 }),
  300,
);
assertEqual(
  "Virada de exatamente 50% para 71%: NÃO concede (limite é <50, não <=50)",
  calcularBonusMelhoriaAcerto({ feitas: 100, acertadas: 50 }, { feitas: 200, acertadas: 142 }),
  0,
);
assertEqual(
  "Virada de exatamente 49% para 70%: NÃO concede (limite é >70, não >=70)",
  calcularBonusMelhoriaAcerto({ feitas: 100, acertadas: 49 }, { feitas: 200, acertadas: 140 }),
  0,
);

assertEqual(
  "Registro que não muda de faixa (40% -> 45%): NÃO concede",
  calcularBonusMelhoriaAcerto({ feitas: 10, acertadas: 4 }, { feitas: 20, acertadas: 9 }),
  0,
);

console.log("\n== Nível (fórmula fechada) ==");
assertEqual("calcularNivel(3150).nivel = 10", calcularNivel(3150).nivel, 10);
assertEqual("calcularNivel(3149).nivel = 9", calcularNivel(3149).nivel, 9);
assertEqual("calcularNivel(0).nivel = 1", calcularNivel(0).nivel, 1);
assertEqual(
  "xpAcumuladoParaNivel(10) = 3150",
  xpAcumuladoParaNivel(10),
  3150,
);
assertEqual(
  "calculateLevelFromXp (wrapper legado usado pelo finish) bate com calcularNivel",
  calculateLevelFromXp(3150),
  10,
);

// Varre uma faixa grande de XP garantindo que o nível nunca "pula" e que
// xpAcumuladoParaNivel(nivel) <= xpTotal < xpAcumuladoParaNivel(nivel+1) sempre.
let inconsistencias = 0;
for (let xp = 0; xp <= 20000; xp += 37) {
  const { nivel } = calcularNivel(xp);
  const limiteAtual = xpAcumuladoParaNivel(nivel);
  const limiteProximo = xpAcumuladoParaNivel(nivel + 1);
  if (!(limiteAtual <= xp && xp < limiteProximo)) {
    inconsistencias++;
    console.log(`  inconsistente em xp=${xp}: nivel=${nivel}, limiteAtual=${limiteAtual}, limiteProximo=${limiteProximo}`);
  }
}
assertEqual("calcularNivel consistente para XP de 0 a 20000 (passo 37)", inconsistencias, 0);

console.log("\n== Nível: título por faixa (faixas não são uniformes: a 1ª tem 9 níveis) ==");
assertEqual("Nível 9 = Iniciante (borda de baixo da 1ª faixa)", calcularNivel(xpAcumuladoParaNivel(9)).titulo, "Iniciante");
assertEqual("Nível 10 = Estudante (1ª faixa só vai até 9)", calcularNivel(xpAcumuladoParaNivel(10)).titulo, "Estudante");
assertEqual("Nível 59 = Mestre", calcularNivel(xpAcumuladoParaNivel(59)).titulo, "Mestre");
assertEqual("Nível 60 = Lenda", calcularNivel(xpAcumuladoParaNivel(60)).titulo, "Lenda");
assertEqual("Nível 200 (bem acima de 60) continua Lenda, não quebra", calcularNivel(xpAcumuladoParaNivel(200)).titulo, "Lenda");

console.log("\n== Streak: avaliação retroativa (função pura) ==");

function dia(anoMesDia: string, metaMinutos: number): DiaStreak {
  const [ano, mes, d] = anoMesDia.split("-").map(Number);
  return {
    data: new Date(Date.UTC(ano, mes - 1, d)),
    metaMinutos,
    chaveMes: `${ano}-${String(mes).padStart(2, "0")}`,
  };
}

{
  // 1 dia falho, 1 escudo disponível naquele mês -> streak preservado, escudo debitado.
  const dias = [dia("2026-09-03", 60)];
  const resultado = avaliarDiasFalhosRetroativo(dias, 5, 5, { "2026-09": 2 });
  assertEqual("Falhar 1 dia com escudo disponível preserva o streak", resultado.streakFinal, 5);
  assertEqual("Falhar 1 dia com escudo disponível debita 1 escudo", resultado.consumoEscudosPorMes["2026-09"], 1);
  assertEqual("Falhar 1 dia com escudo disponível não marca streak como zerado", resultado.streakZerado, false);
}

{
  // 1 dia falho, sem escudo disponível -> streak zera, recorde preservado.
  const dias = [dia("2026-09-03", 60)];
  const resultado = avaliarDiasFalhosRetroativo(dias, 5, 8, { "2026-09": 0 });
  assertEqual("Falhar sem escudo zera o streak", resultado.streakFinal, 0);
  assertEqual("Falhar sem escudo mantém o recorde anterior", resultado.recordeFinal, 8);
  assertEqual("Falhar sem escudo marca streak como zerado", resultado.streakZerado, true);
}

{
  // Dia com meta 0 (disponibilidade zero naquele dia da semana) é neutro: não falha.
  const dias = [dia("2026-09-06", 0)];
  const resultado = avaliarDiasFalhosRetroativo(dias, 5, 5, {});
  assertEqual("Dia com meta 0 não consome escudo nem zera o streak", resultado.streakFinal, 5);
  assertEqual("Dia com meta 0 não gera consumo de escudo", Object.keys(resultado.consumoEscudosPorMes).length, 0);
}

{
  // 3 dias falhos seguidos, só 2 escudos disponíveis: os 2 primeiros são
  // absorvidos, o 3º zera (e os escudos não "sobram" de um mês pro outro
  // dentro da mesma varredura além do que já foi informado como disponível).
  const dias = [dia("2026-09-01", 60), dia("2026-09-02", 60), dia("2026-09-03", 60)];
  const resultado = avaliarDiasFalhosRetroativo(dias, 5, 5, { "2026-09": 2 });
  assertEqual("3 dias falhos com só 2 escudos: streak zera no 3º dia", resultado.streakFinal, 0);
  assertEqual("3 dias falhos com só 2 escudos: consome os 2 escudos antes de zerar", resultado.consumoEscudosPorMes["2026-09"], 2);
}

console.log(`\n${falhas === 0 ? "Todos os testes passaram." : `${falhas} teste(s) falharam.`}`);
process.exit(falhas === 0 ? 0 : 1);
