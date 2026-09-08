import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { dashboardController } from "../controllers/dashboard.controller";

const router = Router();

/**
 * @openapi
 * /api/dashboard:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Estatisticas e insights agregados numa unica requisicao
 *     description: >
 *       Cobertura do objetivo, horas por materia (ideal vs real), acerto por
 *       assunto, excesso de confianca, streak e aderencia ao ciclo. Nenhum
 *       calculo pesado fica por conta do frontend.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: periodo
 *         schema:
 *           type: string
 *           enum: ["7d", "30d", "90d"]
 *           default: "30d"
 *     responses:
 *       200:
 *         description: Dashboard retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/DashboardResponse"
 *       401:
 *         description: Token nao fornecido ou invalido
 *       404:
 *         description: Usuario nao encontrado
 *       422:
 *         description: Parametro periodo invalido
 *       500:
 *         description: Erro interno
 */
router.get("", authMiddleware, dashboardController.get);

export default router;
