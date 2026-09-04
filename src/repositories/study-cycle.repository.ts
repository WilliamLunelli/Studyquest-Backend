import prisma from "../config/database";
import {
  CreateCycleBlockInput,
  UpdateCycleBlockInput,
} from "../types/cycle.types";

export const studyCycleRepository = {
  // So isto: desativa o(s) ciclo(s) ativo(s) do usuario, se houver.
  // Geracao/leitura de ciclo e o bloco B - fora do escopo do Modulo 1.
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

  getCompletedTopicIdsByUser(userId: string) {
    return prisma.cycleBlock.findMany({
      where: {
        status: "CONCLUIDO",
        topicId: {
          not: null,
        },
        cycle: {
          userId,
        },
      },
      distinct: ["topicId"],
      select: {
        topicId: true,
      },
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

      // se veio ordem, reorganiza todos os blocos
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

  completeBlock(userId: string, blockId: string) {
    return prisma.$transaction(async (tx) => {
      const block = await tx.cycleBlock.findFirst({
        where: {
          id: blockId,
          cycle: {
            userId,
            ativo: true,
          },
        },
        select: {
          cycle: {
            select: {
              id: true,
              posicaoAtual: true,

              blocks: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      });

      if (!block) {
        return null;
      }

      const updateResult = await tx.cycleBlock.updateMany({
        where: {
          id: blockId,
          status: "PENDENTE",
        },
        data: {
          status: "CONCLUIDO",
        },
      });

      const xpGanho = updateResult.count > 0 ? 200 : 0;

      const blocoAtualizado = await tx.cycleBlock.findUniqueOrThrow({
        where: { id: blockId },
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

      const totalBlocos = block.cycle.blocks.length;

      if (updateResult.count > 0) {
        const novaPosicao =
          totalBlocos === 0 ? 0 : (block.cycle.posicaoAtual + 1) % totalBlocos;

        await tx.studyCycle.update({
          where: { id: block.cycle.id },
          data: {
            posicaoAtual: novaPosicao,
          },
        });
      }

      if (xpGanho > 0) {
        await tx.user.update({
          where: { id: userId },
          data: {
            xpTotal: {
              increment: xpGanho,
            },
          },
        });

        await tx.xpEvent.create({
          data: {
            userId,
            quantidade: xpGanho,
            motivo: "Assunto do ciclo concluído.",
          },
        });
      }

      return { bloco: blocoAtualizado, xpGanho };
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
