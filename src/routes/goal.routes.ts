import { Router } from "express";
import { goalController } from "../controllers/goal.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @openapi
 * /api/goals:
 *   get:
 *     tags:
 *       - Onboarding
 *     summary: Catálogo de objetivos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tipo
 *         required: false
 *         schema:
 *           type: string
 *           enum: [enem, concurso]
 *     responses:
 *       200:
 *         description: Lista de objetivos retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/GoalListItem"
 *       401:
 *         description: Token não fornecido ou inválido
 *       422:
 *         description: Parâmetro 'tipo' inválido
 *       500:
 *         description: Erro interno
 */
router.get("/", authMiddleware, goalController.list);

/**
 * @openapi
 * /api/goals/{id}/weights:
 *   get:
 *     tags:
 *       - Onboarding
 *     summary: Pesos das áreas do objetivo, com matérias aninhadas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Pesos retornados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/GoalWeightItem"
 *       401:
 *         description: Token não fornecido ou inválido
 *       404:
 *         description: Objetivo não encontrado
 *       500:
 *         description: Erro interno
 */
router.get("/:id/weights", authMiddleware, goalController.weights);

export default router;
