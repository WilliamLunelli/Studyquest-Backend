import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { homeController } from "../controllers/home.controller";

const router = Router();

/**
 * @openapi
 * /api/home:
 *   get:
 *     tags:
 *       - Home
 *     summary: Payload agregado da tela inicial
 *     description: Retorna em uma unica requisicao proximo bloco, revisoes, streak, XP e quantidade de usuarios estudando agora.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados da Home retornados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/HomeResponse"
 *       401:
 *         description: Token nao fornecido ou invalido
 *       409:
 *         description: Onboarding incompleto ou ciclo ainda nao gerado
 *       500:
 *         description: Erro interno
 */
router.get("", authMiddleware, homeController.get);

export default router;
