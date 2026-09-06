import prisma from "../config/database";
import { Prisma } from "../generated/prisma/client";
import { SessionType } from "../generated/prisma/enums";
import { studyCycleRepository } from "./study-cycle.repository";
import { xpEventRepository } from "./xp-event.repository";
import {
  CreateSessionInput,
  FinishSessionRepositoryInput,
} from "../types/session.types";
import { calculateAccumulatedMinutesAt } from "../utils/session.utils";
import { calculateSessionXp } from "../utils/xp.utils";
import {
  addDays,
  calculateNextReviewPlan,
  startOfDay,
} from "../utils/review.utils";

const SESSION_SELECT = {
  id: true,
  userId: true,
  status: true,
  startedAt: true,
  resumedAt: true,
  minutosAcumulados: true,
  duracaoAlvoMin: true,
  preset: true,
  type: true,
  subjectId: true,
  topicId: true,
  cycleBlockId: true,
  originReviewId: true,
};

export const sessionRepository = {
  // Usado pela avaliação retroativa de streak (gamification.service)
  // para achar o último dia com estudo real. IMPORTANTE: dentro do
  // finish, isto é chamado ANTES de fechar a sessão atual (por isso
  // ainda enxerga status RUNNING/PAUSED nela) — o `excludeSessionId`
  // é só um cinto-e-suspensório caso a ordem mude no futuro: sem os
  // dois, a sessão que está sendo finalizada agora viraria o próprio
  // "último dia estudado", a lacuna desapareceria e dias falhados
  // sumiriam silenciosamente da varredura.
  async findLastStudiedDay(
    userId: string,
    excludeSessionId?: string,
    client: Prisma.TransactionClient = prisma,
  ) {
    const last = await client.studySession.findFirst({
      where: {
        userId,
        status: "FINISHED",
        studiedAt: { not: null },
        id: excludeSessionId ? { not: excludeSessionId } : undefined,
      },
      orderBy: { studiedAt: "desc" },
      select: { studiedAt: true },
    });

    return last?.studiedAt ?? null;
  },

  findActiveByUserId(userId: string) {
    return prisma.studySession.findFirst({
      where: { userId, status: { in: ["RUNNING", "PAUSED"] } },
      select: SESSION_SELECT,
    });
  },

  findById(id: string) {
    return prisma.studySession.findUnique({
      where: { id },
      select: SESSION_SELECT,
    });
  },

  findSubjectById(subjectId: string) {
    return prisma.subject.findUnique({
      where: { id: subjectId },
      select: { id: true },
    });
  },

  findTopicById(topicId: string) {
    return prisma.topic.findUnique({
      where: { id: topicId },
      select: { id: true },
    });
  },

  create(userId: string, data: CreateSessionInput, targetDurationMin: number | null) {
    // startedAt and resumedAt are written with the same instant: that's
    // what makes calculateAccumulatedMinutes treat a "just created
    // session" and a "resumed session" the same way (RUNNING = minutosAcumulados
    // + (now - resumedAt)), without a special case for a brand-new session.
    const now = new Date();

    return prisma.studySession.create({
      data: {
        userId,
        subjectId: data.subjectId,
        topicId: data.topicId,
        cycleBlockId: data.blocoId ?? null,
        originReviewId: data.reviewId ?? null,
        type: data.tipo,
        preset: data.preset,
        duracaoAlvoMin: targetDurationMin,
        startedAt: now,
        resumedAt: now,
      },
      select: SESSION_SELECT,
    });
  },

  pause(id: string, accumulatedMinutes: number) {
    return prisma.studySession.update({
      where: { id },
      data: {
        status: "PAUSED",
        minutosAcumulados: accumulatedMinutes,
        resumedAt: null,
      },
      select: SESSION_SELECT,
    });
  },

  resume(id: string) {
    return prisma.studySession.update({
      where: { id },
      data: {
        status: "RUNNING",
        resumedAt: new Date(),
      },
      select: SESSION_SELECT,
    });
  },

  finishWithEffects(
    userId: string,
    sessionId: string,
    input: FinishSessionRepositoryInput,
  ) {
    return prisma.$transaction(
      async (tx) => {
        const now = new Date();
        const today = startOfDay(now);
        const endOfDay = addDays(today, 1);

        const session = await tx.studySession.findUnique({
          where: { id: sessionId },
          select: {
            id: true,
            userId: true,
            status: true,
            startedAt: true,
            resumedAt: true,
            minutosAcumulados: true,
            type: true,
            subjectId: true,
            topicId: true,
            cycleBlockId: true,
            originReviewId: true,
            user: {
              select: {
                xpTotal: true,
                level: true,
                streakAtual: true,
                streakRecorde: true,
                availabilities: {
                  select: {
                    diaSemana: true,
                    minutos: true,
                  },
                },
              },
            },
            originReview: {
              select: {
                id: true,
                agendadaPara: true,
                repeticao: true,
              },
            },
          },
        });

        if (!session) {
          return "NOT_FOUND" as const;
        }

        if (session.userId !== userId) {
          return "FORBIDDEN" as const;
        }

        if (session.status !== "RUNNING" && session.status !== "PAUSED") {
          return "INVALID_STATUS" as const;
        }

        const minutosTotais = calculateAccumulatedMinutesAt(session, now);
        const sessaoCurta = minutosTotais < 5;

        const minutosHojeResult = await tx.studySession.aggregate({
          where: {
            userId,
            status: "FINISHED",
            finishedAt: {
              gte: today,
              lt: endOfDay,
            },
          },
          _sum: {
            minutosAcumulados: true,
          },
        });

        const minutosHojeAntes = minutosHojeResult._sum.minutosAcumulados ?? 0;
        const minutosHojeDepois = minutosHojeAntes + minutosTotais;
        const metaDiariaMin =
          session.user.availabilities.find((availability) => {
            return availability.diaSemana === now.getDay();
          })?.minutos ?? 0;
        const metaCumprida =
          metaDiariaMin > 0 && minutosHojeDepois >= metaDiariaMin;
        const metaJaEstavaCumprida =
          metaDiariaMin > 0 && minutosHojeAntes >= metaDiariaMin;
        const deveIncrementarStreak = metaCumprida && !metaJaEstavaCumprida;

        const revisaoNoPrazo =
          session.type === SessionType.REVISAO &&
          session.originReview !== null &&
          session.originReview.agendadaPara >= today &&
          session.originReview.agendadaPara < endOfDay;
        const multiplicador = !sessaoCurta && revisaoNoPrazo ? 2 : 1;
        const xpGanho = sessaoCurta
          ? 0
          : calculateSessionXp(
              minutosHojeAntes,
              minutosTotais,
              multiplicador,
            );

        // streakAtual/streakRecorde já vêm resolvidos: session.service.ts
        // chama avaliarStreakRetroativo (que quita qualquer lacuna passada
        // com escudo, ou zera o streak) ANTES de chamar finishWithEffects,
        // numa transação própria que já commitou. O que falta aqui é só a
        // decisão de HOJE (bateu a meta pela primeira vez no dia ou não).
        const nivelAnterior = session.user.level;
        let xpTotal = session.user.xpTotal;
        let nivelAtual = nivelAnterior;
        const streakAtual = deveIncrementarStreak
          ? session.user.streakAtual + 1
          : session.user.streakAtual;
        const streakRecorde = Math.max(session.user.streakRecorde, streakAtual);

        const finishedSession = await tx.studySession.update({
          where: { id: sessionId },
          data: {
            status: "FINISHED",
            minutosAcumulados: minutosTotais,
            resumedAt: null,
            finishedAt: now,
            studiedAt: now,
            selfRating: input.selfRating,
            notes: input.notes,
            xpEarned: xpGanho,
          },
          select: {
            id: true,
            type: true,
            finishedAt: true,
            minutosAcumulados: true,
          },
        });

        if (xpGanho > 0) {
          const resultadoXp = await xpEventRepository.grantWithClient(
            tx,
            userId,
            xpGanho,
            "Sessão de estudo concluída",
          );

          xpTotal = resultadoXp.xpTotal;
          nivelAtual = resultadoXp.nivelAtual;
        }

        await tx.user.update({
          where: { id: userId },
          data: { streakAtual, streakRecorde },
        });

        if (!sessaoCurta && session.originReviewId) {
          await tx.reviewSchedule.updateMany({
            where: {
              id: session.originReviewId,
              userId,
              status: "PENDENTE",
            },
            data: {
              status: "CONCLUIDA",
            },
          });
        }

        const nextReviewPlan =
          !sessaoCurta && session.topicId
            ? calculateNextReviewPlan({
                selfRating: input.selfRating,
                originReview: session.originReview,
                referenceDate: now,
              })
            : null;

        const existingPendingReview =
          nextReviewPlan && session.topicId
            ? await tx.reviewSchedule.findFirst({
                where: {
                  userId,
                  topicId: session.topicId,
                  status: "PENDENTE",
                },
                select: {
                  id: true,
                },
              })
            : null;

        const proximaRevisao =
          nextReviewPlan && session.topicId
            ? existingPendingReview
              ? await tx.reviewSchedule.update({
                  where: {
                    id: existingPendingReview.id,
                  },
                  data: {
                    agendadaPara: addDays(today, nextReviewPlan.intervaloDias),
                    repeticao: nextReviewPlan.repeticao,
                  },
                  select: {
                    id: true,
                    agendadaPara: true,
                  },
                })
              : await tx.reviewSchedule.create({
                  data: {
                    userId,
                    topicId: session.topicId,
                    agendadaPara: addDays(today, nextReviewPlan.intervaloDias),
                    repeticao: nextReviewPlan.repeticao,
                  },
                  select: {
                    id: true,
                    agendadaPara: true,
                  },
                })
            : null;

        if (!sessaoCurta && session.cycleBlockId) {
          await studyCycleRepository.advanceOnBlockFinish(tx, session.cycleBlockId);
        }

        const activeCycle = await tx.studyCycle.findFirst({
          where: {
            userId,
            ativo: true,
          },
          select: {
            posicaoAtual: true,
            blocks: {
              orderBy: {
                ordem: "asc",
              },
              select: {
                id: true,
                duracao: true,
                subject: {
                  select: {
                    nome: true,
                  },
                },
                topic: {
                  select: {
                    nome: true,
                  },
                },
              },
            },
          },
        });

        const blocoAtual = activeCycle
          ? activeCycle.blocks[activeCycle.posicaoAtual] ?? activeCycle.blocks[0]
          : null;

        return {
          sessao: finishedSession,
          xp: {
            ganho: xpGanho,
            multiplicador,
            total: xpTotal,
            nivelAnterior,
            nivelAtual,
            subiuDeNivel: nivelAnterior !== nivelAtual,
          },
          streak: {
            atual: streakAtual,
            metaCumprida,
            // escudoUsado real (se algum escudo foi consumido na
            // varredura retroativa desta chamada) vem de fora — ver
            // session.service.ts::finishSession, que chama
            // avaliarStreakRetroativo antes disto e mescla o resultado.
          },
          proximaRevisao: {
            reviewId: proximaRevisao?.id ?? null,
            agendadaPara: proximaRevisao?.agendadaPara ?? null,
            intervaloDias: nextReviewPlan?.intervaloDias ?? null,
          },
          proximoBloco: {
            blocoId: blocoAtual?.id ?? null,
            materia: blocoAtual?.subject.nome ?? null,
            assunto: blocoAtual?.topic?.nome ?? null,
            duracaoMin: blocoAtual?.duracao ?? null,
          },
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  },
};
