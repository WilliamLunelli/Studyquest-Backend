import { Router } from "express";
import {
  loginController,
  registerController,
} from "../controllers/user.controller";
import { validateBody } from "../middlewares/validation.middleware";
import { UserLogin, UserRegister } from "../validations/user.validations";

const router = Router();

/**
 * @openapi
 * /api/users/register:
 *   post:
 *     tags:
 *       - Usuarios
 *     summary: Cadastrar novo usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/UserRegister"
 *     responses:
 *       201:
 *         description: Usuario criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: usuario criado com sucesso
 *                 user:
 *                   $ref: "#/components/schemas/User"
 *       400:
 *         description: Email ja existe ou dados invalidos
 *       500:
 *         description: Erro interno
 */
router.post("/register", validateBody(UserRegister), registerController);

/**
 * @openapi
 * /api/users/login:
 *   post:
 *     tags:
 *       - Usuarios
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
 *                 message:
 *                   type: string
 *                   example: Login realizado!
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   $ref: "#/components/schemas/User"
 *       400:
 *         description: Email ou senha incorretos
 *       500:
 *         description: Erro interno
 */
router.post("/login", validateBody(UserLogin), loginController);

// TODO: implement login, profile handlers
// router.get("/profile");
// router.put("/profile");

export default router;
