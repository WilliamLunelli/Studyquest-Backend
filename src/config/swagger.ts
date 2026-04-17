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
        UserRegister: {
          type: "object",
          required: ["email", "username", "password"],
          properties: {
            email: { type: "string", example: "william@email.com" },
            username: { type: "string", example: "william", minLength: 3, maxLength: 20 },
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
          required: ["subjectId", "studyTime", "rate"],
          properties: {
            subjectId: { type: "string", format: "uuid", example: "a1b2c3d4-0000-0000-0000-000000000000" },
            studyTime: { type: "integer", minimum: 1, example: 45, description: "Tempo estudado em minutos" },
            questions: { type: "integer", minimum: 0, example: 10, default: 0, description: "Quantidade de questões respondidas" },
            rate: { type: "number", minimum: 0, maximum: 10, example: 8, description: "Nota de 0 a 10" },
          },
        },
      },
    },
    paths: {
      "/api/users/register": {
        post: {
          tags: ["Usuários"],
          summary: "Cadastrar novo usuário",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserRegister" },
              },
            },
          },
          responses: {
            201: {
              description: "Usuário criado com sucesso",
              content: {
                "application/json": {
                  example: {
                    message: "usuário criado com sucesso",
                    user: { id: "uuid", email: "william@email.com", username: "william" },
                  },
                },
              },
            },
            400: { description: "Email já existe ou dados inválidos" },
          },
        },
      },
      "/api/users/login": {
        post: {
          tags: ["Usuários"],
          summary: "Fazer login",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserLogin" },
              },
            },
          },
          responses: {
            200: {
              description: "Login realizado com sucesso",
              content: {
                "application/json": {
                  example: {
                    message: "Login realizado!",
                    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                    user: { id: "uuid", email: "william@email.com", username: "william" },
                  },
                },
              },
            },
            400: { description: "Email ou senha incorretos" },
          },
        },
      },
      "/api/registros": {
        get: {
          tags: ["Sessões de Estudo"],
          summary: "Listar sessões do usuário autenticado",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Lista de sessões retornada com sucesso",
              content: {
                "application/json": {
                  example: {
                    sessions: [
                      {
                        id: "uuid",
                        userId: "uuid",
                        subjectId: "uuid",
                        studyTime: 45,
                        questions: 10,
                        rate: 8,
                        createdAt: "2026-04-17T12:00:00.000Z",
                      },
                    ],
                  },
                },
              },
            },
            401: { description: "Token não fornecido ou inválido" },
          },
        },
        post: {
          tags: ["Sessões de Estudo"],
          summary: "Criar nova sessão de estudo",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateSession" },
              },
            },
          },
          responses: {
            201: {
              description: "Sessão criada com sucesso",
              content: {
                "application/json": {
                  example: {
                    message: "Sessão de estudo criada com sucesso",
                    session: {
                      id: "uuid",
                      userId: "uuid",
                      subjectId: "uuid",
                      studyTime: 45,
                      questions: 10,
                      rate: 8,
                      createdAt: "2026-04-17T12:00:00.000Z",
                    },
                  },
                },
              },
            },
            400: { description: "Dados inválidos" },
            401: { description: "Token não fornecido ou inválido" },
          },
        },
      },
      "/api/health": {
        get: {
          tags: ["Health"],
          summary: "Verificar se o servidor está online",
          responses: {
            200: { description: "Servidor online" },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
