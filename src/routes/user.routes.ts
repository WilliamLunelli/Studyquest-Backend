import { Router } from "express";
import {
  loginController,
  meController,
  registerController,
} from "../controllers/user.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validation.middleware";
import { UserLogin, UserRegister } from "../validations/user.validations";

const router = Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Autenticação
 *     summary: Cadastrar novo usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/UserRegister"
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/RegisterResponse"
 *       409:
 *         description: E-mail já cadastrado
 *       422:
 *         description: Dados de entrada inválidos
 *       500:
 *         description: Erro interno
 */
router.post("/register", validateBody(UserRegister), registerController);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Autenticação
 *     summary: Fazer login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/UserLogin"
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   $ref: "#/components/schemas/UserSummary"
 *       401:
 *         description: E-mail ou senha inválidos
 *       422:
 *         description: Dados de entrada inválidos
 *       500:
 *         description: Erro interno
 */
router.post("/login", validateBody(UserLogin), loginController);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags:
 *       - Autenticação
 *     summary: Dados do usuário autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usuário retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/MeResponse"
 *       401:
 *         description: Token não fornecido ou inválido
 *       500:
 *         description: Erro interno
 */
router.get("/me", authMiddleware, meController);

export default router;
