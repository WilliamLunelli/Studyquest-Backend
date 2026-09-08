import { Router } from "express";
import { questionLogController } from "../controllers/question-log.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validation.middleware";
import { CreateQuestionLog } from "../validations/question-log.validation";

const router = Router();

/**
 * @openapi
 * /api/question-logs:
 *   post:
 *     tags:
 *       - Question Logs
 *     summary: Registra questoes resolvidas fora da plataforma
 *     description: Concede 15 XP uma vez por assunto no mesmo dia e antecipa revisao quando o percentual de acerto fica abaixo de 50%.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/CreateQuestionLogRequest"
 *     responses:
 *       201:
 *         description: Registro criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/CreateQuestionLogResponse"
 *       401:
 *         description: Token nao fornecido ou invalido
 *       404:
 *         description: Sessao de estudo nao encontrada
 *       422:
 *         description: Dados invalidos ou acertadas maior que feitas
 *       500:
 *         description: Erro interno
 */
router.post(
  "/",
  authMiddleware,
  validateBody(CreateQuestionLog),
  questionLogController.create,
);

/**
 * @openapi
 * /api/question-logs:
 *   get:
 *     tags:
 *       - Question Logs
 *     summary: Historico paginado de questoes resolvidas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: subjectId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: topicId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: de
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: ate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *     responses:
 *       200:
 *         description: Historico retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/QuestionLogListResponse"
 *       401:
 *         description: Token nao fornecido ou invalido
 *       422:
 *         description: Filtros invalidos
 *       500:
 *         description: Erro interno
 */
router.get("/", authMiddleware, questionLogController.list);

export default router;
