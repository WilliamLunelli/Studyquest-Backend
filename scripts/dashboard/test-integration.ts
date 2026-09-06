/**
 * Testes de integração do dashboard (dashboard.repository + dashboard.service
 * + reaproveitamento de cycle.service.getCycleAlignment). Cada cenário cria
 * seu próprio usuário isolado e limpa tudo no final (try/finally).
 *
 * Pré-requisito: DATABASE_URL configurado e catálogo (seed) já rodado
 * (precisa de pelo menos 1 Goal com GoalWeight/Area/Subject/Topic).
 *
 * Rodar com: npx tsx scripts/dashboard/test-integration.ts
 */
import "dotenv/config";
import prisma from "../../src/config/database";
import { getDashboard } from "../../src/services/dashboard.service";
import * as cycleService from "../../src/services/cycle.service";
import { streakShieldRepository } from "../../src/repositories/streak-shield.repository";
import { calcularBlocosPlanejados } from "../../src/utils/dashboard.utils";

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

async function criarUsuarioTeste(nome: string, createdAt?: Date) {
  const email = `teste-dashboard-${nome}-${Date.now()}-${Math.random().toString(36).slice(2)}@studyquest.local`;
  return prisma.user.create({
    data: { email, username: `Teste ${nome}`, password: "x", createdAt },
  });
}

async function limparUsuarioTeste(userId: string) {
  await prisma.cycleBlock.deleteMany({ where: { cycle: { userId } } });
  await prisma.studyCycle.deleteMany({ where: { userId } });
  await prisma.studySession.deleteMany({ where: { userId } });
  await prisma.questionLog.deleteMany({ where: { userId } });
  await prisma.completedTopic.deleteMany({ where: { userId } });
  await prisma.improvedTopic.deleteMany({ where: { userId } });
  await prisma.userDifficulty.deleteMany({ where: { userId } });
  await prisma.userAvailability.deleteMany({ where: { userId } });
  await prisma.xpEvent.deleteMany({ where: { userId } });
  await prisma.streakShield.deleteMany({ where: { userId } });
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

/** Meio-dia local do dia hoje+offsetDias — longe o bastante de meia-noite
 * pra não cair no dia errado por causa de fuso horário. */
function diaOffset(offsetDias: number): Date {
  const data = new Date();
  data.setHours(12, 0, 0, 0);
  data.setDate(data.getDate() + offsetDias);
  return data;
}

async function criarSessaoFinalizada(params: {
  userId: string;
  subjectId: string;
  topicId: string;
  offsetDias: number;
  selfRating?: "TRAVEI" | "OK" | "TRANQUILO";
  cycleBlockId?: string;
}) {
  const instante = diaOffset(params.offsetDias);
  return prisma.studySession.create({
    data: {
      userId: params.userId,
      subjectId: params.subjectId,
      topicId: params.topicId,
      cycleBlockId: params.cycleBlockId,
      type: "TEORIA",
      preset: "LIVRE",
      status: "FINISHED",
      startedAt: instante,
      finishedAt: instante,
      studiedAt: instante,
      minutosAcumulados: 30,
      selfRating: params.selfRating,
    },
  });
}

async function criarQuestionLog(params: {
  userId: string;
  topicId: string;
  feitas: number;
  acertadas: number;
  offsetDias: number;
}) {
  return prisma.questionLog.create({
    data: {
      userId: params.userId,
      topicId: params.topicId,
      feitas: params.feitas,
      acertadas: params.acertadas,
      data: diaOffset(params.offsetDias),
    },
  });
}

async function testeUsuarioNovoSemNada() {
  console.log("\n== Usuário novo sem objetivo, sem sessão, sem nada: estrutura válida, sem erro ==");
  const user = await criarUsuarioTeste("novo-sem-nada");

  try {
    const dashboard = await getDashboard(user.id, {});

    assertEqual("cobertura zerada, não null", dashboard.cobertura, {
      assuntosTotais: 0,
      assuntosVistos: 0,
      percentual: 0,
    });
    assertEqual("horasPorMateria é lista vazia (sem objetivo), não erro", dashboard.horasPorMateria, []);
    assertEqual("acertoPorAssunto é lista vazia", dashboard.acertoPorAssunto, []);
    assertEqual("excessoConfianca é lista vazia", dashboard.excessoConfianca, []);
    assertEqual("streak com escudos cheios e sem histórico", dashboard.streak, {
      atual: 0,
      recorde: 0,
      escudosDisponiveis: 2,
    });
    assertEqual("aderenciaCiclo zerada (sem ciclo ativo)", dashboard.aderenciaCiclo, {
      blocosPlanejados: 0,
      blocosConcluidos: 0,
      percentual: 0,
    });

    const percentuais = [
      dashboard.cobertura.percentual,
      dashboard.aderenciaCiclo.percentual,
      ...dashboard.acertoPorAssunto.map((i) => i.percentual),
      ...dashboard.excessoConfianca.map((i) => i.percentualAcerto),
    ];
    assertTrue("Nenhum percentual é NaN", percentuais.every((p) => !Number.isNaN(p)));
  } finally {
    await limparUsuarioTeste(user.id);
  }
}

async function testeAcertoPorAssuntoPisoDeAmostra(topicId: string) {
  console.log("\n== acertoPorAssunto: piso de 10 questões ==");
  const user = await criarUsuarioTeste("piso-amostra");

  try {
    await criarQuestionLog({ userId: user.id, topicId, feitas: 9, acertadas: 5, offsetDias: 0 });

    const comNove = await getDashboard(user.id, {});
    assertEqual(
      "Assunto com 9 questões NÃO aparece em acertoPorAssunto",
      comNove.acertoPorAssunto.some((i) => i.topicId === topicId),
      false,
    );

    await criarQuestionLog({ userId: user.id, topicId, feitas: 1, acertadas: 1, offsetDias: 0 });

    const comDez = await getDashboard(user.id, {});
    const item = comDez.acertoPorAssunto.find((i) => i.topicId === topicId);
    assertTrue("Assunto com 10 questões (total acumulado) aparece", item !== undefined);
    assertEqual("feitas somadas corretamente (9+1=10)", item?.feitas, 10);
    assertEqual("acertadas somadas corretamente (5+1=6)", item?.acertadas, 6);
    assertEqual("percentual = 60%", item?.percentual, 60);
  } finally {
    await limparUsuarioTeste(user.id);
  }
}

async function testeExcessoConfiancaPisoDeAutoavaliacoes(topicId: string, subjectId: string) {
  console.log("\n== excessoConfianca: piso de 3 autoavaliações TRANQUILO ==");
  const user = await criarUsuarioTeste("piso-tranquilo");

  try {
    // 47/100 = 47%, abaixo do limiar de 60% — só falta o piso de TRANQUILO.
    await criarQuestionLog({ userId: user.id, topicId, feitas: 100, acertadas: 47, offsetDias: 0 });

    await criarSessaoFinalizada({ userId: user.id, subjectId, topicId, offsetDias: -1, selfRating: "TRANQUILO" });
    await criarSessaoFinalizada({ userId: user.id, subjectId, topicId, offsetDias: -2, selfRating: "TRANQUILO" });

    const comDuas = await getDashboard(user.id, {});
    assertEqual(
      "2 autoavaliações TRANQUILO com 47% de acerto NÃO aparece em excessoConfianca",
      comDuas.excessoConfianca.some((i) => i.topicId === topicId),
      false,
    );

    await criarSessaoFinalizada({ userId: user.id, subjectId, topicId, offsetDias: -3, selfRating: "TRANQUILO" });

    const comTres = await getDashboard(user.id, {});
    const item = comTres.excessoConfianca.find((i) => i.topicId === topicId);
    assertTrue("3 autoavaliações TRANQUILO com 47% de acerto APARECE em excessoConfianca", item !== undefined);
    assertEqual("autoavaliacoesTranquilo = 3", item?.autoavaliacoesTranquilo, 3);
    assertEqual("percentualAcerto = 47%", item?.percentualAcerto, 47);
  } finally {
    await limparUsuarioTeste(user.id);
  }
}

async function testeExcessoConfiancaLimiteDoPercentual(topicId: string, subjectId: string) {
  console.log("\n== excessoConfianca: limite é <60%, não <=60% ==");
  const user = await criarUsuarioTeste("limite-percentual");

  try {
    // 61/100 = 61%, acima do limiar — não deve aparecer mesmo com 3+ TRANQUILO.
    await criarQuestionLog({ userId: user.id, topicId, feitas: 100, acertadas: 61, offsetDias: 0 });
    for (let i = 1; i <= 3; i++) {
      await criarSessaoFinalizada({ userId: user.id, subjectId, topicId, offsetDias: -i, selfRating: "TRANQUILO" });
    }

    const dashboard = await getDashboard(user.id, {});
    assertEqual(
      "3 TRANQUILO com 61% de acerto NÃO aparece em excessoConfianca",
      dashboard.excessoConfianca.some((i) => i.topicId === topicId),
      false,
    );
  } finally {
    await limparUsuarioTeste(user.id);
  }
}

async function testeRevisaoAntecipadaOlhaRegistroIndividual(topicId: string, subjectId: string) {
  console.log("\n== excessoConfianca.revisaoAntecipada: reflete a regra real (<50% por registro) ==");
  const user = await criarUsuarioTeste("revisao-antecipada");

  try {
    // Dois registros de 50% cada (nenhum individualmente <50%): agregado
    // também 50% (<60, entra em excessoConfianca), mas nenhum registro
    // isolado cruzou o limiar de antecipação — revisaoAntecipada deve ser false.
    await criarQuestionLog({ userId: user.id, topicId, feitas: 40, acertadas: 20, offsetDias: 0 });
    await criarQuestionLog({ userId: user.id, topicId, feitas: 40, acertadas: 20, offsetDias: -1 });
    for (let i = 1; i <= 3; i++) {
      await criarSessaoFinalizada({ userId: user.id, subjectId, topicId, offsetDias: -i, selfRating: "TRANQUILO" });
    }

    const semAntecipacao = await getDashboard(user.id, {});
    const itemSemAntecipacao = semAntecipacao.excessoConfianca.find((i) => i.topicId === topicId);
    assertTrue("Assunto aparece em excessoConfianca (agregado 50% < 60%)", itemSemAntecipacao !== undefined);
    assertEqual(
      "Nenhum registro individual <50%: revisaoAntecipada = false",
      itemSemAntecipacao?.revisaoAntecipada,
      false,
    );
  } finally {
    await limparUsuarioTeste(user.id);
  }
}

async function testeRevisaoAntecipadaDetectaRegistroRuim(topicId: string, subjectId: string) {
  console.log("\n== excessoConfianca.revisaoAntecipada: true quando existe registro isolado <50% ==");
  const user = await criarUsuarioTeste("revisao-antecipada-true");

  try {
    // Um registro bem ruim (30%) e um bom (70%): agregado 50% (<60, entra),
    // e o registro de 30% sozinho já cruzaria a regra real de antecipação.
    await criarQuestionLog({ userId: user.id, topicId, feitas: 40, acertadas: 12, offsetDias: 0 }); // 30%
    await criarQuestionLog({ userId: user.id, topicId, feitas: 40, acertadas: 28, offsetDias: -1 }); // 70%
    for (let i = 1; i <= 3; i++) {
      await criarSessaoFinalizada({ userId: user.id, subjectId, topicId, offsetDias: -i, selfRating: "TRANQUILO" });
    }

    const dashboard = await getDashboard(user.id, {});
    const item = dashboard.excessoConfianca.find((i) => i.topicId === topicId);
    assertTrue("Assunto aparece em excessoConfianca", item !== undefined);
    assertEqual("Existe registro isolado <50%: revisaoAntecipada = true", item?.revisaoAntecipada, true);
  } finally {
    await limparUsuarioTeste(user.id);
  }
}

async function testePeriodoNaoIncluiDadoAntigo(topicId: string) {
  console.log("\n== período 7d não inclui dado de 8 dias atrás ==");
  const user = await criarUsuarioTeste("periodo-7d");

  try {
    await criarQuestionLog({ userId: user.id, topicId, feitas: 20, acertadas: 10, offsetDias: -8 });

    const em7d = await getDashboard(user.id, { periodo: "7d" });
    assertEqual(
      "periodo=7d NÃO enxerga QuestionLog de 8 dias atrás",
      em7d.acertoPorAssunto.some((i) => i.topicId === topicId),
      false,
    );

    const em30d = await getDashboard(user.id, { periodo: "30d" });
    const item = em30d.acertoPorAssunto.find((i) => i.topicId === topicId);
    assertTrue("periodo=30d enxerga o mesmo registro", item !== undefined);
    assertEqual("percentual correto em 30d (10/20=50%)", item?.percentual, 50);
  } finally {
    await limparUsuarioTeste(user.id);
  }
}

async function testePeriodoInvalidoRetornaErro() {
  console.log("\n== periodo inválido: 422, não 500 nem valor mudo ==");
  const user = await criarUsuarioTeste("periodo-invalido");

  try {
    let capturou422 = false;
    try {
      await getDashboard(user.id, { periodo: "1y" });
    } catch (error: any) {
      capturou422 = error?.statusCode === 422;
    }
    assertTrue("periodo='1y' (fora do enum) lança AppError 422", capturou422);
  } finally {
    await limparUsuarioTeste(user.id);
  }
}

async function testeCobertura(goalId: string, subjectId: string, topicId: string) {
  console.log("\n== cobertura: assuntos com sessão FINISHED / total do objetivo ==");
  const user = await criarUsuarioTeste("cobertura");

  try {
    await prisma.user.update({ where: { id: user.id }, data: { goalId } });

    const antes = await getDashboard(user.id, {});
    assertEqual("Sem nenhuma sessão ainda, assuntosVistos = 0", antes.cobertura.assuntosVistos, 0);

    await criarSessaoFinalizada({ userId: user.id, subjectId, topicId, offsetDias: 0 });

    const depois = await getDashboard(user.id, {});
    assertEqual("Após 1 sessão FINISHED nesse assunto, assuntosVistos = 1", depois.cobertura.assuntosVistos, 1);
    assertEqual(
      "percentual = round(1/assuntosTotais*100)",
      depois.cobertura.percentual,
      Math.round((1 / depois.cobertura.assuntosTotais) * 100),
    );
  } finally {
    await limparUsuarioTeste(user.id);
  }
}

async function testeStreakEEscudos() {
  console.log("\n== streak: reaproveita streakShieldRepository, não recalcula ==");
  const user = await criarUsuarioTeste("streak");

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { streakAtual: 4, streakRecorde: 10 },
    });

    const hoje = new Date();
    await streakShieldRepository.registrarConsumo(user.id, hoje.getMonth() + 1, hoje.getFullYear(), 1);

    const dashboard = await getDashboard(user.id, {});
    assertEqual("streak.atual reflete o valor do usuário", dashboard.streak.atual, 4);
    assertEqual("streak.recorde reflete o valor do usuário", dashboard.streak.recorde, 10);
    assertEqual("escudosDisponiveis = 2 - 1 consumido = 1", dashboard.streak.escudosDisponiveis, 1);
  } finally {
    await limparUsuarioTeste(user.id);
  }
}

async function testeAderenciaCicloEHorasPorMateria(
  goalId: string,
  subjectIds: string[],
  subjectId: string,
  topicId: string,
) {
  console.log("\n== aderenciaCiclo e horasPorMateria: com onboarding e ciclo completos ==");
  const user = await criarUsuarioTeste("aderencia-ciclo");

  try {
    await completarOnboarding(user.id, goalId, subjectIds);

    // createdAt do ciclo bem no passado (60 dias): garante que
    // diasEfetivos NÃO é clampado pelo período de 30d pedido abaixo —
    // este teste mede o caso "ciclo velho o bastante", não o clamp em
    // si (esse é testado separadamente em testeAderenciaClampaPeloCiclo).
    const cycle = await prisma.studyCycle.create({
      data: {
        userId: user.id,
        createdAt: diaOffset(-60),
        blocks: {
          create: [
            { ordem: 1, duracao: 30, subjectId, topicId },
            { ordem: 2, duracao: 30, subjectId, topicId },
            { ordem: 3, duracao: 60, subjectId, topicId },
          ],
        },
      },
      include: { blocks: true },
    });

    // Disponibilidade: 60min x 7 dias = 420min/semana. Duração média dos
    // blocos do ciclo: (30+30+60)/3 = 40min. Período padrão (30d), ciclo
    // com 60 dias de vida (não clampa):
    // blocosPlanejados = round(420 * (30/7) / 40) = round(45) = 45.
    const esperadoPlanejados = calcularBlocosPlanejados(420, 30, 40);

    for (let i = 0; i < 5; i++) {
      await criarSessaoFinalizada({
        userId: user.id,
        subjectId,
        topicId,
        offsetDias: -i,
        cycleBlockId: cycle.blocks[i % cycle.blocks.length]!.id,
      });
    }

    const dashboard = await getDashboard(user.id, {});

    assertEqual("blocosPlanejados bate com a fórmula pura (disponibilidade / duração média)", dashboard.aderenciaCiclo.blocosPlanejados, esperadoPlanejados);
    assertEqual("blocosConcluidos = 5 sessões FINISHED com cycleBlockId no período", dashboard.aderenciaCiclo.blocosConcluidos, 5);
    assertEqual(
      "percentual = round(5/blocosPlanejados*100)",
      dashboard.aderenciaCiclo.percentual,
      Math.round((5 / esperadoPlanejados) * 100),
    );

    assertTrue("horasPorMateria não é vazio com onboarding completo", dashboard.horasPorMateria.length > 0);
    const materiaTestada = dashboard.horasPorMateria.find((i) => i.subjectId === subjectId);
    assertTrue("A matéria do ciclo aparece em horasPorMateria", materiaTestada !== undefined);
  } finally {
    await limparUsuarioTeste(user.id);
  }
}

async function testeHorasPorMateriaClampaPeloCreatedAtDoUsuario(
  goalId: string,
  subjectIds: string[],
) {
  console.log(
    "\n== horasPorMateria: conta de 20 dias cumprindo a meta ideal todo dia, periodo=90d NÃO deve sair 'abaixo' ==",
  );
  // Regressão do bug relatado: sem o clamp por diasEfetivos, o ideal em
  // periodo=90d escala pelos 90 dias inteiros mesmo a conta só existindo
  // há 20 — o usuário parece "abaixo" em tudo mesmo tendo acertado a
  // proporção ideal 100% dos dias em que a conta existiu.
  const user = await criarUsuarioTeste("clamp-user-createdat", diaOffset(-20));

  try {
    await completarOnboarding(user.id, goalId, subjectIds);

    // Ideal semanal por matéria (mesma lógica usada pelo dashboard),
    // pra distribuir os minutos reais na proporção exata do ideal.
    const idealSemanal = await cycleService.getCycleAlignment(user.id);
    const idealPorSubject = new Map(idealSemanal.map((i) => [i.subjectId, i.minutosIdeaisSemana]));
    const subjectsComTopico = await prisma.subject.findMany({
      where: { id: { in: subjectIds } },
      select: { id: true, topics: { select: { id: true }, take: 1 } },
    });

    for (let dia = 0; dia < 20; dia++) {
      const instante = diaOffset(-dia);

      for (const subject of subjectsComTopico) {
        const topico = subject.topics[0];
        const idealDiario = Math.round((idealPorSubject.get(subject.id) ?? 0) / 7);
        if (!topico || idealDiario <= 0) {
          continue;
        }

        await prisma.studySession.create({
          data: {
            userId: user.id,
            subjectId: subject.id,
            topicId: topico.id,
            type: "TEORIA",
            preset: "LIVRE",
            status: "FINISHED",
            startedAt: instante,
            finishedAt: instante,
            studiedAt: instante,
            minutosAcumulados: idealDiario,
          },
        });
      }
    }

    const dashboard = await getDashboard(user.id, { periodo: "90d" });

    const materiasComIdeal = dashboard.horasPorMateria.filter(
      (m) => (idealPorSubject.get(m.subjectId) ?? 0) > 0,
    );
    const algumaAbaixo = materiasComIdeal.some((m) => m.status === "abaixo");

    assertTrue(
      "Nenhuma matéria com ideal>0 aparece 'abaixo' em periodo=90d (conta de 20 dias, meta cumprida todo dia)",
      !algumaAbaixo,
    );
  } finally {
    await limparUsuarioTeste(user.id);
  }
}

async function testeAderenciaClampaPeloCicloRecente(
  goalId: string,
  subjectIds: string[],
  subjectId: string,
  topicId: string,
) {
  console.log(
    "\n== aderenciaCiclo: conta antiga + ciclo criado há 5 dias, periodo=30d reflete 5 dias, não 30 ==",
  );
  // Regressão do bug relatado: aderenciaCiclo usa o createdAt do CICLO
  // ATIVO (não da conta) como âncora — regenerar o ciclo é ação normal
  // (troca de objetivo, mudança de disponibilidade), então um ciclo
  // recém-criado numa conta antiga tem que clampar pelos dias do ciclo.
  const user = await criarUsuarioTeste("clamp-cycle-createdat", diaOffset(-200));

  try {
    await completarOnboarding(user.id, goalId, subjectIds);

    const cycle = await prisma.studyCycle.create({
      data: {
        userId: user.id,
        createdAt: diaOffset(-5),
        blocks: {
          create: [
            { ordem: 1, duracao: 30, subjectId, topicId },
            { ordem: 2, duracao: 30, subjectId, topicId },
            { ordem: 3, duracao: 60, subjectId, topicId },
          ],
        },
      },
      include: { blocks: true },
    });

    for (let i = 0; i < 3; i++) {
      await criarSessaoFinalizada({
        userId: user.id,
        subjectId,
        topicId,
        offsetDias: -i,
        cycleBlockId: cycle.blocks[i % cycle.blocks.length]!.id,
      });
    }

    // Disponibilidade 420min/semana, duração média de bloco 40min, ciclo
    // com 6 dias efetivos (5 dias atrás + hoje, ver diasDesde) mesmo
    // pedindo periodo=30d:
    // esperado = round(420 * (6/7) / 40) = round(9) = 9 — bem diferente
    // do que sairia escalando pelos 30 dias pedidos (45).
    const esperadoComClamp = calcularBlocosPlanejados(420, 6, 40);
    const esperadoSemClamp = calcularBlocosPlanejados(420, 30, 40);

    const dashboard = await getDashboard(user.id, { periodo: "30d" });

    assertEqual(
      "blocosPlanejados reflete os dias do CICLO (6), não o periodo pedido (30)",
      dashboard.aderenciaCiclo.blocosPlanejados,
      esperadoComClamp,
    );
    assertTrue(
      "blocosPlanejados com clamp é bem menor que sem clamp (prova que o clamp está ativo)",
      dashboard.aderenciaCiclo.blocosPlanejados < esperadoSemClamp,
    );
    assertEqual("blocosConcluidos = 3 sessões no período", dashboard.aderenciaCiclo.blocosConcluidos, 3);
  } finally {
    await limparUsuarioTeste(user.id);
  }
}

async function testePerformanceComVolume(subjectId: string, topicId: string) {
  console.log("\n== performance: smoke test com volume (não substitui o benchmark de 6 meses) ==");
  const user = await criarUsuarioTeste("performance");

  try {
    const questionLogs = Array.from({ length: 200 }, (_, i) => ({
      userId: user.id,
      topicId,
      feitas: 10 + (i % 5),
      acertadas: 5 + (i % 5),
      data: diaOffset(-(i % 90)),
    }));
    await prisma.questionLog.createMany({ data: questionLogs });

    const sessions = Array.from({ length: 200 }, (_, i) => {
      const instante = diaOffset(-(i % 90));
      return {
        userId: user.id,
        subjectId,
        topicId,
        type: "TEORIA" as const,
        preset: "LIVRE" as const,
        status: "FINISHED" as const,
        startedAt: instante,
        finishedAt: instante,
        studiedAt: instante,
        minutosAcumulados: 30,
        selfRating: (i % 3 === 0 ? "TRANQUILO" : "OK") as const,
      };
    });
    await prisma.studySession.createMany({ data: sessions });

    const inicio = Date.now();
    await getDashboard(user.id, { periodo: "90d" });
    const duracaoMs = Date.now() - inicio;

    console.log(`   getDashboard(periodo=90d) com 200 QuestionLog + 200 StudySession: ${duracaoMs}ms`);
    assertTrue("Smoke test: menos de 1500ms com volume moderado local", duracaoMs < 1500);
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
  const subjectComTopico = todosOsSubjects.find((s) => s.topics.length >= 1);

  if (!subjectComTopico) {
    console.log("Nenhuma matéria do catálogo tem assunto. Precisa disso pra rodar os testes.");
    process.exit(1);
  }

  const subjectId = subjectComTopico.id;
  const topicId = subjectComTopico.topics[0]!.id;

  await testeUsuarioNovoSemNada();
  await testeAcertoPorAssuntoPisoDeAmostra(topicId);
  await testeExcessoConfiancaPisoDeAutoavaliacoes(topicId, subjectId);
  await testeExcessoConfiancaLimiteDoPercentual(topicId, subjectId);
  await testeRevisaoAntecipadaOlhaRegistroIndividual(topicId, subjectId);
  await testeRevisaoAntecipadaDetectaRegistroRuim(topicId, subjectId);
  await testePeriodoNaoIncluiDadoAntigo(topicId);
  await testePeriodoInvalidoRetornaErro();
  await testeCobertura(goal.id, subjectId, topicId);
  await testeStreakEEscudos();
  await testeAderenciaCicloEHorasPorMateria(
    goal.id,
    todosOsSubjects.map((s) => s.id),
    subjectId,
    topicId,
  );
  await testeHorasPorMateriaClampaPeloCreatedAtDoUsuario(
    goal.id,
    todosOsSubjects.map((s) => s.id),
  );
  await testeAderenciaClampaPeloCicloRecente(
    goal.id,
    todosOsSubjects.map((s) => s.id),
    subjectId,
    topicId,
  );
  await testePerformanceComVolume(subjectId, topicId);

  console.log(`\n${falhas === 0 ? "Todos os testes passaram." : `${falhas} teste(s) falharam.`}`);
  await prisma.$disconnect();
  process.exit(falhas === 0 ? 0 : 1);
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
