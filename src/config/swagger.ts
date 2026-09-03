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
      },
    },
  },
  apis: ["./src/routes/*.routes.ts", "./dist/routes/*.routes.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
