import prisma from "../config/database";
import { Prisma } from "../generated/prisma/client";
import {
  CreateCycleBlockInput,
  UpdateCycleBlockInput,
} from "../types/cycle.types";

export const studyCycleRepository = {
  invalidateActiveCycle(userId: string) {
    return prisma.studyCycle.updateMany({
      where: { userId, ativo: true },
      data: { ativo: false },
    });
  },

  getCycleGenerationData(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        goalId: true,

        availabilities: {
          select: {
            diaSemana: true,
            minutos: true,
          },
        },

        difficulties: {
          select: {
            subjectId: true,
            dificuldade: true,
          },
        },

        goal: {
          select: {
            weights: {
              select: {
                peso: true,
                area: {
                  select: {
                    id: true,
                    nome: true,
                    subjects: {
                      select: {
                        id: true,
                        nome: true,
                        topics: {
                          select: {
                            id: true,
                            nome: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  },

  getCycleActive(userId: string) {
    return prisma.studyCycle.findFirst({
      where: { userId, ativo: true },
      select: {
        id: true,
        createdAt: true,
        posicaoAtual: true,
        blocks: {
          orderBy: {
            ordem: "asc",
          },
          select: {
            id: true,
            ordem: true,
            subject: {
              select: {
                id: true,
                nome: true,
              },
            },
            topic: {
              select: {
                id: true,
                nome: true,
              },
            },
            duracao: true,
            status: true,
          },
        },
      },
    });
  },

  createCycleWithBlocks(
    userId: string,
    cycleBlockInput: CreateCycleBlockInput[],
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.studyCycle.updateMany({
        where: { userId, ativo: true },
        data: {
          ativo: false,
        },
      });

      return tx.studyCycle.create({
        data: {
          userId,
          blocks: {
            create: cycleBlockInput,
          },
        },
        include: {
          blocks: {
            orderBy: {
              ordem: "asc",
            },
            include: {
              subject: {
                select: {
                  id: true,
                  nome: true,
                },
              },
              topic: {
                select: {
                  id: true,
                  nome: true,
                },
              },
            },
          },
        },
      });
    });
  },

  updateBlock(userId: string, blockId: string, data: UpdateCycleBlockInput) {
    return prisma.$transaction(async (tx) => {
      const block = await tx.cycleBlock.findFirst({
        where: {
          id: blockId,
          cycle: {
            userId,
            ativo: true,
          },
        },
        include: {
          cycle: {
            select: {
              id: true,
              blocks: {
                orderBy: {
                  ordem: "asc",
                },
                select: {
                  id: true,
                  ordem: true,
                },
              },
            },
          },
        },
      });

      if (!block) {
        return null;
      }

      const subjectId = data.subjectId ?? block.subjectId;
      const topicId = data.topicId === undefined ? block.topicId : data.topicId;

      if (
        topicId !== null &&
        (data.subjectId !== undefined || data.topicId !== undefined)
      ) {
        const topic = await tx.topic.findFirst({
          where: {
            id: topicId,
            subjectId,
          },
          select: {
            id: true,
          },
        });

        if (!topic) {
          return "INVALID_TOPIC" as const;
        }
      }

      if (data.ordem !== undefined) {
        const outrosBlocos = block.cycle.blocks.filter((item) => {
          return item.id !== block.id;
        });

        const novaPosicao = Math.max(
          0,
          Math.min(data.ordem - 1, outrosBlocos.length),
        );

        const blocosReordenados = [
          ...outrosBlocos.slice(0, novaPosicao),
          block,
          ...outrosBlocos.slice(novaPosicao),
        ];

        await Promise.all(
          blocosReordenados.map((item, index) => {
            return tx.cycleBlock.update({
              where: {
                id: item.id,
              },
              data: {
                ordem: index + 1,
              },
            });
          }),
        );
      }

      return tx.cycleBlock.update({
        where: {
          id: blockId,
        },
        data: {
          duracao: data.duracaoMin,
          subjectId: data.subjectId,
          topicId: data.topicId,
        },
        select: {
          id: true,
          ordem: true,
          duracao: true,
          status: true,
          subject: {
            select: {
              id: true,
              nome: true,
            },
          },
          topic: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      });
    });
  },

  // Usado por POST /cycles/blocks/:id/complete — "concluir o ASSUNTO
  // do bloco", não o bloco em si. Só busca e valida posse; a decisão
  // de já estar concluído (CompletedTopic) e a concessão de XP ficam
  // no service, que também precisa do gamification.service.
  findOwnedBlockWithTopic(userId: string, blockId: string) {
    return prisma.cycleBlock.findFirst({
      where: {
        id: blockId,
        cycle: {
          userId,
          ativo: true,
        },
      },
      select: {
        id: true,
        ordem: true,
        duracao: true,
        status: true,
        subjectId: true,
        subject: {
          select: {
            id: true,
            nome: true,
          },
        },
        topicId: true,
        topic: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });
  },

  /**
   * Concluir BLOCO (fatia de tempo) é diferente de concluir ASSUNTO
   * (ver findOwnedBlockWithTopic / CompletedTopic): isto só marca que
   * essa rotação do ciclo já passou por aqui e avança o ponteiro —
   * sem XP, sem julgamento sobre o quanto o usuário aprendeu. É por
   * isso que só o finish chama isto, nunca o endpoint /complete.
   *
   * Recebe `tx` porque roda DENTRO da transação do finish
   * (session.repository.ts) — não abre uma transação própria.
   * Idempotente: updateMany só afeta a linha se ainda estiver
   * PENDENTE, então uma segunda chamada pro mesmo bloco não avança
   * o ponteiro de novo.
   *
   * Ao voltar pra posição 0, o ciclo deu uma volta completa: todo
   * CycleBlock volta pra PENDENTE (é execução da volta atual, não
   * conhecimento permanente — quem guarda isso é CompletedTopic, que
   * este reset nunca toca) e voltasCompletas incrementa. Sem isso, a
   * partir da 2ª volta todo bloco fica CONCLUIDO pra sempre e o status
   * para de significar qualquer coisa.
   */
  async advanceOnBlockFinish(tx: Prisma.TransactionClient, cycleBlockId: string) {
    const updateResult = await tx.cycleBlock.updateMany({
      where: { id: cycleBlockId, status: "PENDENTE" },
      data: { status: "CONCLUIDO" },
    });

    if (updateResult.count === 0) {
      return;
    }

    const cycle = await tx.studyCycle.findFirst({
      where: {
        ativo: true,
        blocks: { some: { id: cycleBlockId } },
      },
      select: {
        id: true,
        posicaoAtual: true,
        blocks: { select: { id: true } },
      },
    });

    if (!cycle || cycle.blocks.length === 0) {
      return;
    }

    const novaPosicao = (cycle.posicaoAtual + 1) % cycle.blocks.length;

    if (novaPosicao === 0) {
      await tx.cycleBlock.updateMany({
        where: { cycleId: cycle.id },
        data: { status: "PENDENTE" },
      });

      await tx.studyCycle.update({
        where: { id: cycle.id },
        data: {
          posicaoAtual: 0,
          voltasCompletas: { increment: 1 },
        },
      });

      return;
    }

    await tx.studyCycle.update({
      where: { id: cycle.id },
      data: { posicaoAtual: novaPosicao },
    });
  },

  getFinishedMinutesBySubject(userId: string) {
    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    return prisma.studySession.groupBy({
      by: ["subjectId"],
      where: {
        userId,
        status: "FINISHED",
        finishedAt: {
          gte: startOfWeek,
          lt: endOfWeek,
        },
      },
      _sum: {
        minutosAcumulados: true,
      },
    });
  },

  getBlockById(blockId: string) {
    return prisma.cycleBlock.findFirst({
      where: {
        id: blockId,
      },
      select: {
        ordem: true,
        duracao: true,
        status: true,
      },
    });
  },
};
