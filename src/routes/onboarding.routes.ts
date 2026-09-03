import { Router } from "express";
import { onboardingController } from "../controllers/onboarding.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validation.middleware";
import {
  SetAvailability,
  SetDifficulties,
  SetGoal,
} from "../validations/onboarding.validations";

const router = Router();

/**
 * @openapi
 * /api/me/goal:
 *   put:
 *     tags:
 *       - Onboarding
 *     summary: Define o objetivo do usuário
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [goalId]
 *             properties:
 *               goalId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Objetivo definido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 objetivo:
 *                   $ref: "#/components/schemas/GoalListItem"
 *                 pesos:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/GoalWeightItem"
 *       401:
 *         description: Token não fornecido ou inválido
 *       404:
 *         description: Objetivo não encontrado
 *       422:
 *         description: Dados de entrada inválidos
 *       500:
 *         description: Erro interno
 */
router.put("/goal", authMiddleware, validateBody(SetGoal), onboardingController.setGoal);

/**
 * @openapi
 * /api/me/availability:
 *   put:
 *     tags:
 *       - Onboarding
 *     summary: Define a disponibilidade semanal do usuário
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [disponibilidade]
 *             properties:
 *               disponibilidade:
 *                 type: array
 *                 minItems: 7
 *                 maxItems: 7
 *                 items:
 *                   type: object
 *                   properties:
 *                     diaSemana:
 *                       type: integer
 *                       minimum: 0
 *                       maximum: 6
 *                     minutos:
 *                       type: integer
 *                       minimum: 0
 *                       maximum: 960
 *     responses:
 *       200:
 *         description: Disponibilidade salva com sucesso
 *       401:
 *         description: Token não fornecido ou inválido
 *       422:
 *         description: Falta algum dia ou minutos fora do intervalo permitido
 *       500:
 *         description: Erro interno
 */
router.put(
  "/availability",
  authMiddleware,
  validateBody(SetAvailability),
  onboardingController.setAvailability,
);

/**
 * @openapi
 * /api/me/difficulties:
 *   put:
 *     tags:
 *       - Onboarding
 *     summary: Autoavaliação de dificuldade por matéria
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [dificuldades]
 *             properties:
 *               dificuldades:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     subjectId:
 *                       type: string
 *                       format: uuid
 *                     nivel:
 *                       type: integer
 *                       minimum: 1
 *                       maximum: 5
 *     responses:
 *       200:
 *         description: Dificuldades salvas com sucesso
 *       401:
 *         description: Token não fornecido ou inválido
 *       409:
 *         description: Usuário ainda não tem objetivo definido
 *       422:
 *         description: Falta alguma matéria do objetivo, ou matéria não pertence a ele
 *       500:
 *         description: Erro interno
 */
router.put(
  "/difficulties",
  authMiddleware,
  validateBody(SetDifficulties),
  onboardingController.setDifficulties,
);

export default router;
