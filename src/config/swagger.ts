import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "StudyQuest API",
      version: "1.0.0",
      description: "API da plataforma gamificada de estudos StudyQuest",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        ErrorResponse: {
          type: "object",
          properties: {
            error: { type: "string", example: "erro interno" },
            message: { type: "string", example: "Dados invalidos" },
          },
        },
        GoalListItem: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "b1c2d3e4-0000-0000-0000-000000000000",
            },
            tipo: { type: "string", enum: ["ENEM", "CONCURSO"], example: "ENEM" },
            nome: { type: "string", example: "Medicina · UFG" },
            instituicao: { type: "string", nullable: true, example: "UFG" },
          },
        },
        GoalWeightItem: {
          type: "object",
          properties: {
            areaId: {
              type: "string",
              format: "uuid",
              example: "c1d2e3f4-0000-0000-0000-000000000000",
            },
            area: { type: "string", example: "Ciências da Natureza" },
            peso: { type: "number", example: 3 },
            subjects: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: {
                    type: "string",
                    format: "uuid",
                    example: "d1e2f3a4-0000-0000-0000-000000000000",
                  },
                  nome: { type: "string", example: "Biologia" },
                },
              },
            },
          },
        },
        MeResponse: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "a1b2c3d4-0000-0000-0000-000000000000",
            },
            nome: { type: "string", example: "William" },
            email: { type: "string", example: "william@email.com" },
            objetivo: {
              type: "object",
              nullable: true,
              properties: {
                id: {
                  type: "string",
                  format: "uuid",
                  example: "b1c2d3e4-0000-0000-0000-000000000000",
                },
                tipo: { type: "string", example: "ENEM" },
                nome: { type: "string", example: "Medicina · UFG" },
                instituicao: { type: "string", example: "UFG" },
              },
            },
            xpTotal: { type: "integer", example: 0 },
            nivel: { type: "integer", example: 1 },
            streakAtual: { type: "integer", example: 0 },
            onboardingCompleto: { type: "boolean", example: false },
          },
        },
        UserSummary: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "a1b2c3d4-0000-0000-0000-000000000000",
            },
            nome: { type: "string", example: "william" },
            email: { type: "string", example: "william@email.com" },
            onboardingCompleto: { type: "boolean", example: false },
          },
        },
        UserRegister: {
          type: "object",
          required: ["nome", "email", "senha"],
          properties: {
            nome: {
              type: "string",
              example: "William",
              minLength: 2,
              maxLength: 60,
            },
            email: { type: "string", example: "william@email.com" },
            senha: { type: "string", example: "senha123", minLength: 6 },
          },
        },
        RegisterResponse: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "a1b2c3d4-0000-0000-0000-000000000000",
            },
            nome: { type: "string", example: "William" },
            email: { type: "string", example: "william@email.com" },
            token: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
          },
        },
        UserLogin: {
          type: "object",
          required: ["email", "senha"],
          properties: {
            email: { type: "string", example: "william@email.com" },
            senha: { type: "string", example: "senha123" },
          },
        },
        CycleBlockResponse: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "11111111-1111-1111-1111-111111111111",
            },
            ordem: { type: "integer", example: 1 },
            subjectId: {
              type: "string",
              format: "uuid",
              example: "22222222-2222-2222-2222-222222222222",
            },
            materia: { type: "string", example: "Matematica" },
            topicId: {
              type: "string",
              format: "uuid",
              nullable: true,
              example: "33333333-3333-3333-3333-333333333333",
            },
            assunto: { type: "string", nullable: true, example: "Funcoes" },
            duracaoMin: { type: "integer", example: 50 },
            status: {
              type: "string",
              enum: ["pendente", "concluido"],
              example: "pendente",
            },
          },
        },
        StudyCycleResponse: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "44444444-4444-4444-4444-444444444444",
            },
            geradoEm: {
              type: "string",
              format: "date-time",
              example: "2026-09-04T12:00:00.000Z",
            },
            posicaoAtual: { type: "integer", example: 0 },
            blocos: {
              type: "array",
              items: { $ref: "#/components/schemas/CycleBlockResponse" },
            },
          },
        },
        UpdateCycleBlock: {
          type: "object",
          minProperties: 1,
          properties: {
            duracaoMin: {
              type: "integer",
              minimum: 25,
              maximum: 60,
              example: 45,
            },
            subjectId: {
              type: "string",
              format: "uuid",
              example: "22222222-2222-2222-2222-222222222222",
            },
            topicId: {
              type: "string",
              format: "uuid",
              nullable: true,
              example: "33333333-3333-3333-3333-333333333333",
            },
            ordem: { type: "integer", minimum: 1, example: 2 },
          },
        },
        CompleteCycleBlockResponse: {
          type: "object",
          properties: {
            bloco: { $ref: "#/components/schemas/CycleBlockResponse" },
            xpGanho: { type: "integer", example: 200 },
          },
        },
        CycleAlignmentItem: {
          type: "object",
          properties: {
            subjectId: {
              type: "string",
              format: "uuid",
              example: "22222222-2222-2222-2222-222222222222",
            },
            materia: { type: "string", example: "Matematica" },
            peso: { type: "number", example: 5 },
            minutosIdeaisSemana: { type: "integer", example: 240 },
            minutosReaisSemana: { type: "integer", example: 180 },
            desvioPercentual: { type: "integer", example: 75 },
            status: {
              type: "string",
              enum: ["abaixo", "ok", "acima"],
              example: "ok",
            },
          },
        },
        HomeResponse: {
          type: "object",
          properties: {
            proximoBloco: {
              type: "object",
              properties: {
                blocoId: {
                  type: "string",
                  format: "uuid",
                  example: "11111111-1111-1111-1111-111111111111",
                },
                materia: { type: "string", example: "Matematica" },
                assunto: { type: "string", nullable: true, example: "Funcoes" },
                duracaoMin: { type: "integer", example: 50 },
                tipoSugerido: {
                  type: "string",
                  enum: ["teoria", "questoes", "revisao"],
                  example: "revisao",
                },
              },
            },
            revisoesHoje: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  reviewId: {
                    type: "string",
                    format: "uuid",
                    example: "55555555-5555-5555-5555-555555555555",
                  },
                  materia: { type: "string", example: "Biologia" },
                  assunto: { type: "string", example: "Citologia" },
                  agendadaPara: {
                    type: "string",
                    format: "date-time",
                    example: "2026-09-04T12:00:00.000Z",
                  },
                  multiplicadorXp: { type: "integer", enum: [1, 2], example: 2 },
                  atrasada: { type: "boolean", example: false },
                },
              },
            },
            streak: {
              type: "object",
              properties: {
                atual: { type: "integer", example: 4 },
                recorde: { type: "integer", example: 12 },
                escudosDisponiveis: { type: "integer", example: 1 },
                metaDiariaMin: { type: "integer", example: 60 },
                minutosHoje: { type: "integer", example: 47 },
                metaCumprida: { type: "boolean", example: false },
              },
            },
            xp: {
              type: "object",
              properties: {
                total: { type: "integer", example: 1250 },
                nivel: { type: "integer", example: 5 },
                titulo: { type: "string", example: "Aprendiz" },
                xpNoNivel: { type: "integer", example: 150 },
                xpParaProximoNivel: { type: "integer", example: 350 },
              },
            },
            estudandoAgora: { type: "integer", example: 47 },
          },
        },
        CreateQuestionLogRequest: {
          type: "object",
          required: ["subjectId", "topicId", "feitas", "acertadas"],
          properties: {
            subjectId: {
              type: "string",
              format: "uuid",
              example: "22222222-2222-2222-2222-222222222222",
            },
            topicId: {
              type: "string",
              format: "uuid",
              example: "33333333-3333-3333-3333-333333333333",
            },
            feitas: {
              type: "integer",
              minimum: 1,
              maximum: 500,
              example: 40,
            },
            acertadas: {
              type: "integer",
              minimum: 0,
              example: 28,
            },
            sessionId: {
              type: "string",
              format: "uuid",
              example: "66666666-6666-6666-6666-666666666666",
            },
            data: {
              type: "string",
              format: "date-time",
              example: "2026-09-04T12:00:00.000Z",
            },
          },
        },
        CreateQuestionLogResponse: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "77777777-7777-7777-7777-777777777777",
            },
            percentualAcerto: { type: "integer", example: 70 },
            xpGanho: { type: "integer", example: 15 },
          },
        },
        QuestionLogItem: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "77777777-7777-7777-7777-777777777777",
            },
            subjectId: {
              type: "string",
              format: "uuid",
              example: "22222222-2222-2222-2222-222222222222",
            },
            materia: { type: "string", example: "Matematica" },
            topicId: {
              type: "string",
              format: "uuid",
              example: "33333333-3333-3333-3333-333333333333",
            },
            assunto: { type: "string", example: "Funcoes" },
            feitas: { type: "integer", example: 40 },
            acertadas: { type: "integer", example: 28 },
            percentualAcerto: { type: "integer", example: 70 },
            data: {
              type: "string",
              format: "date-time",
              example: "2026-09-04T12:00:00.000Z",
            },
          },
        },
        QuestionLogListResponse: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: { $ref: "#/components/schemas/QuestionLogItem" },
            },
            aggregate: {
              type: "object",
              properties: {
                feitas: { type: "integer", example: 120 },
                acertadas: { type: "integer", example: 84 },
                percentualAcerto: { type: "integer", example: 70 },
              },
            },
            pagination: {
              type: "object",
              properties: {
                page: { type: "integer", example: 1 },
                limit: { type: "integer", example: 20 },
                total: { type: "integer", example: 3 },
                totalPages: { type: "integer", example: 1 },
              },
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.routes.ts", "./dist/routes/*.routes.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
