/**
 * Testes de integração com o banco real (xp-event.repository,
 * streak-shield.repository e o fluxo completo de avaliarStreakRetroativo).
 * Cada cenário cria seu próprio usuário de teste isolado e apaga tudo
 * no final (try/finally), mesmo se uma asserção falhar no meio.
 *
 * Pré-requisito: DATABASE_URL configurado e catálogo (seed) já rodado
 * (precisa de pelo menos 1 Subject com 1 Topic existente).
 *
 * Rodar com: npx tsx scripts/gamification/test-integration.ts
 */
import "dotenv/config";
import prisma from "../../src/config/database";
import { xpEventRepository } from "../../src/repositories/xp-event.repository";
import { streakShieldRepository } from "../../src/repositories/streak-shield.repository";
import {
  avaliarStreakRetroativo,
  concederBonusMelhoriaAcerto,
} from "../../src/services/gamification.service";
import { createQuestionLog } from "../../src/services/question-log.service";

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

/**
 * Devolve um instante real (não uma "chave de dia") dentro do dia civil
 * hoje+offsetDias em America/Sao_Paulo. Meio-dia UTC = 9h em SP (UTC-3),
 * bem no meio do dia — meia-noite UTC NÃO serviria aqui, porque
 * corresponde a ~21h do dia ANTERIOR em SP, e reconverter isso via
 * Intl/timeZone (como o serviço faz) devolveria o dia errado.
 */
function diaEmSaoPauloParaTeste(offsetDias: number): Date {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const ano = Number(partes.find((p) => p.type === "year")!.value);
  const mes = Number(partes.find((p) => p.type === "month")!.value);
  const dia = Number(partes.find((p) => p.type === "day")!.value);

  const data = new Date(Date.UTC(ano, mes - 1, dia, 12, 0, 0));
  data.setUTCDate(data.getUTCDate() + offsetDias);
  return data;
}

async function criarUsuarioTeste(nome: string) {
  const email = `teste-gamificacao-${nome}-${Date.now()}-${Math.random().toString(36).slice(2)}@studyquest.local`;
  return prisma.user.create({
    data: { email, username: `Teste ${nome}`, password: "x" },
  });
}

async function limparUsuarioTeste(userId: string) {
  await prisma.studySession.deleteMany({ where: { userId } });
  await prisma.questionLog.deleteMany({ where: { userId } });
  await prisma.improvedTopic.deleteMany({ where: { userId } });
  await prisma.xpEvent.deleteMany({ where: { userId } });
  await prisma.streakShield.deleteMany({ where: { userId } });
  await prisma.userAvailability.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
}

async function criarDisponibilidade(userId: string, minutosPorDia: number) {
  await prisma.userAvailability.createMany({
    data: Array.from({ length: 7 }, (_, diaSemana) => ({
      userId,
      diaSemana,
      minutos: minutosPorDia,
    })),
  });
}

async function criarSessaoFinalizada(
  userId: string,
  subjectId: string,
  topicId: string,
  offsetDias: number,
) {
  const instante = diaEmSaoPauloParaTeste(offsetDias);
  await prisma.studySession.create({
    data: {
      userId,
      subjectId,
      topicId,
      type: "TEORIA",
      preset: "LIVRE",
      status: "FINISHED",
      startedAt: instante,
      finishedAt: instante,
      studiedAt: instante,
      minutosAcumulados: 60,
    },
  });
}

async function testeXpEventGrant() {
  console.log("== xp-event.repository: grant ==");
  const user = await criarUsuarioTeste("xp-grant");

  try {
    const primeiraConcessao = await xpEventRepository.grant(user.id, 50, "Teste 1");
    assertEqual("grant(50) não sobe de nível (precisa de 150 pra nível 2)", primeiraConcessao.subiuDeNivel, false);
    assertEqual("grant(50) atualiza xpTotal", primeiraConcessao.xpTotal, 50);

    const segundaConcessao = await xpEventRepository.grant(user.id, 200, "Teste 2");
    assertEqual("grant(200) acumulado (250) sobe pro nível 2", segundaConcessao.nivelAtual, 2);
    assertEqual("grant(200) marca subiuDeNivel", segundaConcessao.subiuDeNivel, true);

    const eventos = await prisma.xpEvent.count({ where: { userId: user.id } });
    assertEqual("Toda concessão de XP gerou um XpEvent (2 concessões = 2 eventos)", eventos, 2);

    const userAtualizado = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    assertEqual("Nível do usuário persistido no banco é 2", userAtualizado.level, 2);
  } finally {
    await limparUsuarioTeste(user.id);
  }
}

async function testeStreakShieldContador() {
  console.log("\n== streak-shield.repository: contador 0-2 por mês ==");
  const user = await criarUsuarioTeste("shield-contador");

  try {
    const mes = 1;
    const ano = 2999; // ano bem no futuro pra não colidir com dados reais de ninguém

    assertEqual("Disponível antes de qualquer consumo = 2", await streakShieldRepository.getDisponiveis(user.id, mes, ano), 2);

    await streakShieldRepository.registrarConsumo(user.id, mes, ano, 1);
    assertEqual("Disponível após consumir 1 = 1", await streakShieldRepository.getDisponiveis(user.id, mes, ano), 1);

    await streakShieldRepository.registrarConsumo(user.id, mes, ano, 1);
    assertEqual("Disponível após consumir os 2 = 0", await streakShieldRepository.getDisponiveis(user.id, mes, ano), 0);

    assertEqual(
      "Mês diferente não é afetado pelo consumo de outro mês",
      await streakShieldRepository.getDisponiveis(user.id, mes + 1, ano),
      2,
    );
  } finally {
    await limparUsuarioTeste(user.id);
  }
}

async function testeStreakRetroativoZeraSemEscudo(subjectId: string, topicId: string) {
  console.log("\n== avaliarStreakRetroativo: 3 dias em aberto estouram os 2 escudos ==");
  const user = await criarUsuarioTeste("streak-zera");

  try {
    // Disponibilidade de 60 min todo dia da semana, pra isolar o teste de
    // "dia neutro" (coberto em outro cenário) e focar no consumo de escudo.
    await criarDisponibilidade(user.id, 60);

    // Último dia estudado: hoje - 4 dias. Isso deixa 3 dias em aberto na
    // varredura (hoje-3, hoje-2, hoje-1) — igual ao cenário "3 dias falhos
    // com só 2 escudos" do teste puro, agora batendo no banco de verdade.
    await criarSessaoFinalizada(user.id, subjectId, topicId, -4);

    await prisma.user.update({
      where: { id: user.id },
      data: { streakAtual: 5, streakRecorde: 5 },
    });

    const resultado = await avaliarStreakRetroativo(user.id);

    assertEqual("3 dias em aberto avaliados", resultado.diasAvaliados, 3);
    assertEqual("Consumiu os 2 escudos do mês antes de zerar", resultado.escudosConsumidos, 2);
    assertEqual("Streak zerou no 3º dia sem escudo", resultado.streakFinal, 0);
    assertEqual("Recorde anterior (5) foi preservado", resultado.recordeFinal, 5);

    const userAposAvaliacao = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    assertEqual("streakAtual persistido no banco = 0", userAposAvaliacao.streakAtual, 0);
    assertEqual("streakRecorde persistido no banco = 5", userAposAvaliacao.streakRecorde, 5);

    const hoje = diaEmSaoPauloParaTeste(0);
    const shieldDoMesAtual = await prisma.streakShield.findUnique({
      where: {
        userId_mes_ano: {
          userId: user.id,
          mes: hoje.getUTCMonth() + 1,
          ano: hoje.getUTCFullYear(),
        },
      },
    });
    assertEqual("Os 2 escudos do mês corrente foram debitados no banco", shieldDoMesAtual?.usados, 2);

    // Chamar de novo sem nenhuma sessão nova não deve consumir mais escudo
    // do que o teto (a lacuna é a mesma, mas getDisponiveis já retorna 0).
    const segundaChamada = await avaliarStreakRetroativo(user.id);
    assertEqual("Chamar de novo sem sessão nova não consome escudo além do teto", segundaChamada.escudosConsumidos, 0);

    const shieldAposSegundaChamada = await prisma.streakShield.findUnique({
      where: {
        userId_mes_ano: {
          userId: user.id,
          mes: hoje.getUTCMonth() + 1,
          ano: hoje.getUTCFullYear(),
        },
      },
    });
    assertEqual("Contador de escudos não passou de 2 mesmo reavaliando de novo", shieldAposSegundaChamada?.usados, 2);
  } finally {
    await limparUsuarioTeste(user.id);
  }
}

async function testeStreakCongelaComDisponibilidadeZero(subjectId: string, topicId: string) {
  console.log("\n== avaliarStreakRetroativo: disponibilidade 0 nos 7 dias congela o streak ==");
  const user = await criarUsuarioTeste("streak-congelado");

  try {
    // Os 7 dias da semana com 0 minutos: todo dia em aberto é neutro,
    // nunca falha. Isso não deveria acontecer com um usuário real (o
    // onboarding pede disponibilidade), mas prova que a varredura não
    // trata "sem meta nenhuma" como falha nem entra em loop.
    await criarDisponibilidade(user.id, 0);
    await criarSessaoFinalizada(user.id, subjectId, topicId, -10);

    await prisma.user.update({
      where: { id: user.id },
      data: { streakAtual: 4, streakRecorde: 7 },
    });

    const inicio = Date.now();
    const resultado = await avaliarStreakRetroativo(user.id);
    const duracaoMs = Date.now() - inicio;

    assertEqual("9 dias em aberto avaliados (todos neutros)", resultado.diasAvaliados, 9);
    assertEqual("Streak não incrementa nem quebra: fica congelado em 4", resultado.streakFinal, 4);
    assertEqual("Streak não é marcado como zerado", resultado.streakZerado, false);
    assertEqual("Recorde não muda", resultado.recordeFinal, 7);
    assertEqual("Nenhum escudo é consumido em dias neutros", resultado.escudosConsumidos, 0);
    assertEqual("Terminou rápido (sem loop preso) — menos de 2s pra 9 dias", duracaoMs < 2000, true);

    const userAposAvaliacao = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    assertEqual("streakAtual no banco continua 4 (não foi tocado)", userAposAvaliacao.streakAtual, 4);
  } finally {
    await limparUsuarioTeste(user.id);
  }
}

async function testeOrdemFindLastStudiedDay(subjectId: string, topicId: string) {
  console.log("\n== avaliarStreakRetroativo: gap de 2 dias detectado corretamente ==");
  console.log(
    "   (regressão pro bug de ordem: findLastStudiedDay tem que ser lido",
  );
  console.log(
    "   ANTES de qualquer sessão de hoje ser fechada — ver comentário em",
  );
  console.log("   session.repository.ts::findLastStudiedDay)");

  const user = await criarUsuarioTeste("streak-ordem");

  try {
    await criarDisponibilidade(user.id, 60);

    // Última sessão finalizada há 3 dias -> a lacuna correta é de 2 dias
    // (hoje-2, hoje-1). Se algum dia alguém inserir a sessão "de hoje"
    // ANTES de chamar findLastStudiedDay, o MAX(studiedAt) passa a ser
    // hoje, a lacuna vira 0 e este teste denuncia (diasAvaliados vira 0
    // e os 2 dias falhados somem sem consumir escudo nenhum).
    await criarSessaoFinalizada(user.id, subjectId, topicId, -3);

    await prisma.user.update({
      where: { id: user.id },
      data: { streakAtual: 5, streakRecorde: 5 },
    });

    const resultado = await avaliarStreakRetroativo(user.id);

    assertEqual("Exatamente 2 dias falhados foram detectados", resultado.diasAvaliados, 2);
    assertEqual("Os 2 dias falhados consumiram 2 escudos (não 0, não 3)", resultado.escudosConsumidos, 2);
    assertEqual("Com os 2 escudos disponíveis, o streak sobrevive", resultado.streakFinal, 5);
    assertEqual("Streak não foi marcado como zerado", resultado.streakZerado, false);
  } finally {
    await limparUsuarioTeste(user.id);
  }
}

async function testeBonusMelhoriaAcertoIdempotente(topicId: string) {
  console.log("\n== concederBonusMelhoriaAcerto: uma vez por assunto, pra sempre ==");
  const user = await criarUsuarioTeste("melhoria-idempotente");

  try {
    const primeiraVirada = await concederBonusMelhoriaAcerto(
      user.id,
      topicId,
      { feitas: 100, acertadas: 40 },
      { feitas: 200, acertadas: 160 },
    );
    assertEqual("1ª virada (40% -> 80%) concede o bônus", primeiraVirada, { concedido: true, xp: 300 });

    const eventosAposPrimeira = await prisma.xpEvent.count({ where: { userId: user.id } });
    assertEqual("1ª virada gerou 1 XpEvent", eventosAposPrimeira, 1);

    // Assunto caiu pra 45% e subiu de novo pra 75% — matematicamente
    // seria outra "virada" válida, mas o assunto já está em
    // ImprovedTopic: não paga uma segunda vez.
    const segundaVirada = await concederBonusMelhoriaAcerto(
      user.id,
      topicId,
      { feitas: 300, acertadas: 135 },
      { feitas: 400, acertadas: 300 },
    );
    assertEqual("2ª virada no MESMO assunto NÃO concede de novo", segundaVirada, { concedido: false, xp: 0 });

    const eventosAposSegunda = await prisma.xpEvent.count({ where: { userId: user.id } });
    assertEqual("2ª virada não gerou XpEvent novo (continua 1)", eventosAposSegunda, 1);

    const userFinal = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    assertEqual("xpTotal não mudou na 2ª tentativa (continua 300)", userFinal.xpTotal, 300);
  } finally {
    await limparUsuarioTeste(user.id);
  }
}

async function testeBonusMelhoriaAcertoFimAFim(subjectId: string, topicId: string) {
  console.log("\n== question-log.service: virada real de <50% para >70% via createQuestionLog ==");
  const user = await criarUsuarioTeste("melhoria-fim-a-fim");

  try {
    // 1º registro: 10 questões, 4 acertos (40%) — bate o piso de 10,
    // mas sozinho não é virada nenhuma (não existe "antes" ainda).
    const primeiro = await createQuestionLog(user.id, {
      subjectId,
      topicId,
      feitas: 10,
      acertadas: 4,
    });
    assertEqual("1º registro só ganha o +15 de registro (sem melhoria ainda)", primeiro.xpGanho, 15);

    // 2º registro: 15 questões, 15 acertos. Antes = 10/4 (40%), depois
    // = 25/19 (76%) — cruza de <50% pra >70% no assunto inteiro.
    const segundo = await createQuestionLog(user.id, {
      subjectId,
      topicId,
      feitas: 15,
      acertadas: 15,
    });
    assertEqual(
      "2º registro no MESMO assunto no MESMO dia: sem +15 de novo, só o +300 da melhoria",
      segundo.xpGanho,
      300,
    );

    const improvedTopic = await prisma.improvedTopic.findUnique({
      where: { userId_topicId: { userId: user.id, topicId } },
    });
    assertEqual("ImprovedTopic foi gravado pra este usuário+assunto", improvedTopic !== null, true);

    const eventos = await prisma.xpEvent.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });
    assertEqual("Gerou exatamente 2 XpEvent (registro + melhoria)", eventos.length, 2);
    assertEqual("O 2º evento é o de melhoria de acerto, com 300 XP", eventos[1]?.quantidade, 300);
  } finally {
    await limparUsuarioTeste(user.id);
  }
}

async function main() {
  const topic = await prisma.topic.findFirst({ select: { id: true, subjectId: true } });

  if (!topic) {
    console.log(
      "Nenhum Topic encontrado no banco. Rode `npm run seed` antes de rodar este teste.",
    );
    process.exit(1);
  }

  await testeXpEventGrant();
  await testeStreakShieldContador();
  await testeStreakRetroativoZeraSemEscudo(topic.subjectId, topic.id);
  await testeStreakCongelaComDisponibilidadeZero(topic.subjectId, topic.id);
  await testeOrdemFindLastStudiedDay(topic.subjectId, topic.id);
  await testeBonusMelhoriaAcertoIdempotente(topic.id);
  await testeBonusMelhoriaAcertoFimAFim(topic.subjectId, topic.id);

  console.log(`\n${falhas === 0 ? "Todos os testes passaram." : `${falhas} teste(s) falharam.`}`);
  await prisma.$disconnect();
  process.exit(falhas === 0 ? 0 : 1);
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
