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
          // TODO validar antes se o topicId pertence ao subjectId final do bloco.
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

  completeBlock(userId: string, blockId: string, xpGanho: number) {
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

      const blocoAtualizado = await tx.cycleBlock.update({
        where: { id: blockId },
        data: {
          status: "CONCLUIDO",
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

      const totalBlocos = block.cycle.blocks.length;

      const novaPosicao =
        totalBlocos === 0 ? 0 : (block.cycle.posicaoAtual + 1) % totalBlocos;

      await tx.studyCycle.update({
        where: { id: block.cycle.id },
        data: {
          posicaoAtual: novaPosicao,
        },
      });

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

      return blocoAtualizado;
    });
  },

  getFinishedMinutesBySubject(userId: string) {
    return prisma.studySession.groupBy({
      by: ["subjectId"],
      // TODO filtrar apenas sessoes finalizadas dentro da semana atual.
      where: { userId, status: "FINISHED" },
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
