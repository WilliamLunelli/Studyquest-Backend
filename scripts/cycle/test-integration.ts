/**
 * Testes de integração do ciclo de estudos (study-cycle.repository +
 * cycle.service): geração excluindo assunto já dominado, e o
 * ponteiro rotativo (avanço, idempotência, volta completa).
 * Cada cenário cria seu próprio usuário isolado e limpa tudo no final.
 *
 * Pré-requisito: DATABASE_URL configurado e catálogo (seed) já rodado
 * (precisa de pelo menos 1 Goal com GoalWeight/Area/Subject/Topic).
 *
 * Rodar com: npx tsx scripts/cycle/test-integration.ts
 */
import "dotenv/config";
import prisma from "../../src/config/database";
import { studyCycleRepository } from "../../src/repositories/study-cycle.repository";
import { createCycle, completeBlock } from "../../src/services/cycle.service";

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

async function criarUsuarioTeste(nome: string) {
  const email = `teste-ciclo-${nome}-${Date.now()}-${Math.random().toString(36).slice(2)}@studyquest.local`;
  return prisma.user.create({
    data: { email, username: `Teste ${nome}`, password: "x" },
  });
}

async function limparUsuarioTeste(userId: string) {
  const cycles = await prisma.studyCycle.findMany({ where: { userId }, select: { id: true } });
  const cycleIds = cycles.map((c) => c.id);

  if (cycleIds.length > 0) {
    await prisma.cycleBlock.deleteMany({ where: { cycleId: { in: cycleIds } } });
  }

  await prisma.studyCycle.deleteMany({ where: { userId } });
  await prisma.completedTopic.deleteMany({ where: { userId } });
  await prisma.userDifficulty.deleteMany({ where: { userId } });
  await prisma.userAvailability.deleteMany({ where: { userId } });
  await prisma.xpEvent.deleteMany({ where: { userId } });
  await prisma.studySession.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
}

async function completarOnboarding(userId: string, goalId: string, subjectIds: string[]) {
  await prisma.user.update({ where: { id: userId }, data: { goalId } });
  await prisma.userDifficulty.createMany({
    data: subjectIds.map((subjectId) => ({ userId, subjectId, dificuldade: 3 })),
  });
  await prisma.userAvailability.createMany({
    data: Array.from({ length: 7 }, (_, diaSemana) => ({ userId, diaSemana, minutos: 60 })),
  });
}

async function criarCicloTeste(
  userId: string,
  subjectId: string,
  topicId: string,
  totalBlocos: number,
) {
  return prisma.studyCycle.create({
    data: {
      userId,
      blocks: {
        create: Array.from({ length: totalBlocos }, (_, i) => ({
          ordem: i + 1,
          duracao: 30,
          subjectId,
          topicId,
        })),
      },
    },
    include: { blocks: { orderBy: { ordem: "asc" } } },
  });
}

async function testeCompletedTopicExcluidoDaGeracao(
  goalId: string,
  todosOsSubjectIds: string[],
  subjectComVariosTopicos: { id: string; topics: { id: string }[] },
) {
  console.log("\n== createCycle: assunto em CompletedTopic não entra no ciclo novo ==");
  const user = await criarUsuarioTeste("completed-topic");

  try {
    await completarOnboarding(user.id, goalId, todosOsSubjectIds);

    const topicoCompletado = subjectComVariosTopicos.topics[0]!;
    await prisma.completedTopic.create({
      data: { userId: user.id, topicId: topicoCompletado.id },
    });

    const cycle = await createCycle(user.id);

    const apareceTopicoCompletado = cycle.blocos.some((b) => b.topicId === topicoCompletado.id);
    assertEqual(
      "Assunto marcado em CompletedTopic não aparece em nenhum bloco do ciclo novo",
      apareceTopicoCompletado,
      false,
    );

    const apareceMateriaPelosOutrosAssuntos = cycle.blocos.some(
      (b) => b.subjectId === subjectComVariosTopicos.id,
    );
    assertTrue(
      "A matéria continua aparecendo via seus outros assuntos pendentes",
      apareceMateriaPelosOutrosAssuntos,
    );
  } finally {
    await limparUsuarioTeste(user.id);
  }
}

async function testePonteiroAvancaEMarcaConcluido(subjectId: string, topicId: string) {
  console.log("\n== advanceOnBlockFinish: avança o ponteiro e marca o bloco CONCLUIDO ==");
  const user = await criarUsuarioTeste("ponteiro-avanca");

  try {
    const cycle = await criarCicloTeste(user.id, subjectId, topicId, 3);

    await prisma.$transaction((tx) => studyCycleRepository.advanceOnBlockFinish(tx, cycle.blocks[0]!.id));

    const bloco = await prisma.cycleBlock.findUniqueOrThrow({ where: { id: cycle.blocks[0]!.id } });
    assertEqual("Bloco concluído vira CONCLUIDO", bloco.status, "CONCLUIDO");

    const cicloAtualizado = await prisma.studyCycle.findUniqueOrThrow({ where: { id: cycle.id } });
    assertEqual("Ponteiro avança de 0 para 1", cicloAtualizado.posicaoAtual, 1);
    assertEqual("voltasCompletas continua 0 (ainda não deu a volta)", cicloAtualizado.voltasCompletas, 0);
  } finally {
    await limparUsuarioTeste(user.id);
  }
}

async function testePonteiroIdempotente(subjectId: string, topicId: string) {
  console.log("\n== advanceOnBlockFinish: bloco já CONCLUIDO não avança de novo (idempotência) ==");
  const user = await criarUsuarioTeste("ponteiro-idempotente");

  try {
    const cycle = await criarCicloTeste(user.id, subjectId, topicId, 3);
    const blocoId = cycle.blocks[0]!.id;

    await prisma.$transaction((tx) => studyCycleRepository.advanceOnBlockFinish(tx, blocoId));
    await prisma.$transaction((tx) => studyCycleRepository.advanceOnBlockFinish(tx, blocoId));

    const cicloAtualizado = await prisma.studyCycle.findUniqueOrThrow({ where: { id: cycle.id } });
    assertEqual(
      "Chamar de novo pro mesmo bloco não avança o ponteiro uma segunda vez",
      cicloAtualizado.posicaoAtual,
      1,
    );
  } finally {
    await limparUsuarioTeste(user.id);
  }
}

async function testeCompleteNaoMexeNoPonteiro(subjectId: string, topicId: string) {
  console.log("\n== completeBlock (/complete): concede +200 e NÃO mexe no ponteiro nem no status ==");
  const user = await criarUsuarioTeste("complete-sem-ponteiro");

  try {
    const cycle = await criarCicloTeste(user.id, subjectId, topicId, 3);

    const resultado = await completeBlock(user.id, cycle.blocks[0]!.id);
    assertEqual("Concede +200 na primeira conclusão do assunto", resultado.xpGanho, 200);

    const cicloAtualizado = await prisma.studyCycle.findUniqueOrThrow({ where: { id: cycle.id } });
    assertEqual("Ponteiro continua em 0 — /complete não avança", cicloAtualizado.posicaoAtual, 0);

    const bloco = await prisma.cycleBlock.findUniqueOrThrow({ where: { id: cycle.blocks[0]!.id } });
    assertEqual("Status do bloco continua PENDENTE — /complete não marca CONCLUIDO", bloco.status, "PENDENTE");
  } finally {
    await limparUsuarioTeste(user.id);
  }
}

async function testeVoltaCompletaESegundaVolta(subjectId: string, topicId: string) {
  console.log("\n== advanceOnBlockFinish: volta completa reseta pra PENDENTE, 2ª volta funciona igual ==");
  const user = await criarUsuarioTeste("volta-completa");

  try {
    const cycle = await criarCicloTeste(user.id, subjectId, topicId, 3);
    const ids = cycle.blocks.map((b) => b.id);

    for (const id of ids) {
      await prisma.$transaction((tx) => studyCycleRepository.advanceOnBlockFinish(tx, id));
    }

    let cicloAtualizado = await prisma.studyCycle.findUniqueOrThrow({ where: { id: cycle.id } });
    assertEqual("Ponteiro volta a 0 ao concluir o último bloco da 1ª volta", cicloAtualizado.posicaoAtual, 0);
    assertEqual("voltasCompletas incrementa pra 1", cicloAtualizado.voltasCompletas, 1);

    let blocos = await prisma.cycleBlock.findMany({ where: { cycleId: cycle.id } });
    assertTrue(
      "Todos os blocos voltam a PENDENTE depois da volta completa (não ficam CONCLUIDO pra sempre)",
      blocos.every((b) => b.status === "PENDENTE"),
    );

    // 2ª volta: mesma sequência de chamadas, tem que se comportar
    // exatamente igual à 1ª — prova que o reset não deixou o ciclo
    // num estado que só funciona uma vez.
    for (const id of ids) {
      await prisma.$transaction((tx) => studyCycleRepository.advanceOnBlockFinish(tx, id));
    }

    cicloAtualizado = await prisma.studyCycle.findUniqueOrThrow({ where: { id: cycle.id } });
    assertEqual("2ª volta também fecha com o ponteiro em 0", cicloAtualizado.posicaoAtual, 0);
    assertEqual("voltasCompletas incrementa de novo, pra 2", cicloAtualizado.voltasCompletas, 2);

    blocos = await prisma.cycleBlock.findMany({ where: { cycleId: cycle.id } });
    assertTrue("Blocos voltam a PENDENTE de novo depois da 2ª volta", blocos.every((b) => b.status === "PENDENTE"));
  } finally {
    await limparUsuarioTeste(user.id);
  }
}

async function main() {
  const goal = await prisma.goal.findFirst({
    include: {
      weights: {
        include: {
          area: {
            include: {
              subjects: { include: { topics: true } },
            },
          },
        },
      },
    },
  });

  if (!goal) {
    console.log("Nenhum Goal encontrado no banco. Rode `npm run seed` antes de rodar este teste.");
    process.exit(1);
  }

  const todosOsSubjects = goal.weights.flatMap((w) => w.area.subjects);
  const subjectComVariosTopicos = todosOsSubjects.find((s) => s.topics.length >= 2);

  if (!subjectComVariosTopicos) {
    console.log(
      "Nenhuma matéria do catálogo tem 2+ assuntos. Precisa disso pra testar exclusão de CompletedTopic sem zerar a matéria inteira.",
    );
    process.exit(1);
  }

  const topic = await prisma.topic.findFirst({ select: { id: true, subjectId: true } });

  if (!topic) {
    console.log("Nenhum Topic encontrado no banco. Rode `npm run seed` antes de rodar este teste.");
    process.exit(1);
  }

  await testeCompletedTopicExcluidoDaGeracao(
    goal.id,
    todosOsSubjects.map((s) => s.id),
    subjectComVariosTopicos,
  );
  await testePonteiroAvancaEMarcaConcluido(topic.subjectId, topic.id);
  await testePonteiroIdempotente(topic.subjectId, topic.id);
  await testeCompleteNaoMexeNoPonteiro(topic.subjectId, topic.id);
  await testeVoltaCompletaESegundaVolta(topic.subjectId, topic.id);

  console.log(`\n${falhas === 0 ? "Todos os testes passaram." : `${falhas} teste(s) falharam.`}`);
  await prisma.$disconnect();
  process.exit(falhas === 0 ? 0 : 1);
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
