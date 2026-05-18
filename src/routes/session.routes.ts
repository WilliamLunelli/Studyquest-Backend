import { Router } from "express";
import {
  createSessionController,
  listSessionsController,
} from "../controllers/session.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validation.middleware";
import { CreateSession } from "../validations/session.validations";

const router = Router();

/**
 * @openapi
 * /api/registros:
 *   get:
 *     tags:
 *       - Sessoes de Estudo
 *     summary: Listar sessoes do usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de sessoes retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessions:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/StudySession"
 *       401:
 *         description: Token nao fornecido ou invalido
 *       500:
 *         description: Erro interno
 */
router.get("/", authMiddleware, listSessionsController);

/**
 * @openapi
 * /api/registros:
 *   post:
 *     tags:
 *       - Sessoes de Estudo
 *     summary: Criar nova sessao de estudo
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/CreateSession"
 *     responses:
 *       201:
 *         description: Sessao criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Sessao de estudo criada com sucesso
 *                 session:
 *                   $ref: "#/components/schemas/StudySession"
 *       400:
 *         description: Dados invalidos
 *       401:
 *         description: Token nao fornecido ou invalido
 *       500:
 *         description: Erro interno
 */
router.post(
  "/",
  authMiddleware,
  validateBody(CreateSession),
  createSessionController,
);

export default router;
