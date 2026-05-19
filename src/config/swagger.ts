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
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "a1b2c3d4-0000-0000-0000-000000000000",
            },
            email: { type: "string", example: "william@email.com" },
            username: { type: "string", example: "william" },
          },
        },
        UserRegister: {
          type: "object",
          required: ["email", "username", "password"],
          properties: {
            email: { type: "string", example: "william@email.com" },
            username: {
              type: "string",
              example: "william",
              minLength: 3,
              maxLength: 20,
            },
            password: { type: "string", example: "senha123", minLength: 6 },
          },
        },
        UserLogin: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", example: "william@email.com" },
            password: { type: "string", example: "senha123" },
          },
        },
        CreateSession: {
          type: "object",
          required: ["subjectId", "studyTime", "rate", "studiedAt"],
          properties: {
            subjectId: {
              type: "string",
              format: "uuid",
              example: "a1b2c3d4-0000-0000-0000-000000000000",
            },
            studyTime: {
              type: "integer",
              minimum: 1,
              example: 45,
              description: "Tempo estudado em minutos",
            },
            questions: {
              type: "integer",
              minimum: 0,
              example: 10,
              default: 0,
              description: "Quantidade de questoes respondidas",
            },
            rate: {
              type: "number",
              minimum: 0,
              maximum: 10,
              example: 8,
              description: "Nota de 0 a 10",
            },
            studiedAt: {
              type: "string",
              format: "date-time",
              example: "2026-05-19T14:00:00.000Z",
              description: "Data e hora real do estudo (ISO 8601)",
            },
            correctAnswers: {
              type: "integer",
              minimum: 0,
              example: 8,
              description: "Questoes acertadas (opcional)",
            },
            sessionType: {
              type: "string",
              enum: ["pomodoro", "manual", "cronômetro"],
              example: "manual",
              description: "Tipo de sessao (opcional)",
            },
            pomodoroCount: {
              type: "integer",
              minimum: 0,
              example: 4,
              description: "Pomodoros completados (opcional)",
            },
            notes: {
              type: "string",
              example: "Estudei algebra hoje",
              description: "Anotacoes livres (opcional)",
            },
          },
        },
        StudySession: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "a1b2c3d4-0000-0000-0000-000000000000",
            },
            userId: {
              type: "string",
              format: "uuid",
              example: "b1c2d3e4-0000-0000-0000-000000000000",
            },
            subjectId: {
              type: "string",
              format: "uuid",
              example: "c1d2e3f4-0000-0000-0000-000000000000",
            },
            studyTime: { type: "integer", example: 45 },
            questions: { type: "integer", example: 10 },
            rate: { type: "number", example: 8 },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2026-04-17T12:00:00.000Z",
            },
          },
        },
        CreateSubject: {
          type: "object",
          required: ["subjectName"],
          properties: {
            subjectName: { type: "string", example: "Matematica" },
            subjectDescription: {
              type: "string",
              example: "Estudos de algebra e geometria",
            },
          },
        },
        UpdateSubject: {
          type: "object",
          properties: {
            areaId: {
              type: "string",
              format: "uuid",
              example: "a1b2c3d4-0000-0000-0000-000000000000",
            },
            subjectName: { type: "string", example: "Fisica" },
            subjectDescription: {
              type: "string",
              example: "Cinematica e dinamica",
            },
          },
        },
        Subject: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "a1b2c3d4-0000-0000-0000-000000000000",
            },
            areaId: {
              type: "string",
              format: "uuid",
              example: "b1c2d3e4-0000-0000-0000-000000000000",
            },
            subjectName: { type: "string", example: "Matematica" },
            subjectDescription: {
              type: "string",
              example: "Estudos de algebra e geometria",
            },
          },
        },
        Area: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "a1b2c3d4-0000-0000-0000-000000000000",
            },
            userId: {
              type: "string",
              format: "uuid",
              example: "b1c2d3e4-0000-0000-0000-000000000000",
            },
            areaName: { type: "string", example: "Exatas" },
            areaDescription: {
              type: "string",
              example: "Materias de calculo e raciocinio logico",
            },
            subjects: {
              type: "array",
              items: { $ref: "#/components/schemas/Subject" },
            },
          },
        },
        CreateArea: {
          type: "object",
          required: ["areaName"],
          properties: {
            areaName: { type: "string", example: "Exatas" },
            areaDescription: {
              type: "string",
              example: "Materias de calculo e raciocinio logico",
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.routes.ts", "./dist/routes/*.routes.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
