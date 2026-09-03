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
      },
    },
  },
  apis: ["./src/routes/*.routes.ts", "./dist/routes/*.routes.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
