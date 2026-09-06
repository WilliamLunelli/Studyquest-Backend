import { Router } from "express";
import { sessionController } from "../controllers/session.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validation.middleware";
import { CreateSession, FinishSession } from "../validations/session.validations";

const router = Router();

/**
 * @openapi
 * /api/sessions:
 *   post:
 *     tags:
 *       - Sessão
 *     summary: Inicia uma sessão de estudo cronometrada
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subjectId, topicId, tipo, preset]
 *             properties:
 *               blocoId:
 *                 type: string
 *                 format: uuid
 *                 description: Opcional até o ciclo de estudos (bloco B) existir.
 *               subjectId:
 *                 type: string
 *                 format: uuid
 *               topicId:
 *                 type: string
 *                 format: uuid
 *               tipo:
 *                 type: string
 *                 enum: [TEORIA, QUESTOES, REVISAO]
 *               preset:
 *                 type: string
 *                 enum: [P25_5, P50_10, LIVRE]
 *               duracaoAlvoMin:
 *                 type: integer
 *                 description: Obrigatório e igual a 25/50 para P25_5/P50_10. Ignorado para LIVRE.
 *               reviewId:
 *                 type: string
 *                 format: uuid
 *                 description: Opcional, ainda não consumido nesta fase.
 *     responses:
 *       201:
 *         description: Sessão iniciada
 *       404:
 *         description: subjectId ou topicId não encontrados
 *       409:
 *         description: Já existe sessão RUNNING ou PAUSED para o usuário
 *       422:
 *         description: duracaoAlvoMin ausente ou incompatível com o preset
 *       500:
 *         description: Erro interno
 */
router.post("/", authMiddleware, validateBody(CreateSession), sessionController.create);

/**
 * @openapi
 * /api/sessions/active:
 *   get:
 *     tags:
 *       - Sessão
 *     summary: Sessão em andamento do usuário, com minutosAcumulados calculados até agora
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sessão ativa (RUNNING ou PAUSED)
 *       204:
 *         description: Não há sessão ativa
 *       500:
 *         description: Erro interno
 */
router.get("/active", authMiddleware, sessionController.getActive);

/**
 * @openapi
 * /api/sessions/{id}/pause:
 *   patch:
 *     tags:
 *       - Sessão
 *     summary: Pausa uma sessão em andamento
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
 *         description: Sessão pausada
 *       403:
 *         description: Sessão pertence a outro usuário
 *       404:
 *         description: Sessão não encontrada
 *       409:
 *         description: Sessão não está RUNNING
 *       500:
 *         description: Erro interno
 */
router.patch("/:id/pause", authMiddleware, sessionController.pause);

/**
 * @openapi
 * /api/sessions/{id}/resume:
 *   patch:
 *     tags:
 *       - Sessão
 *     summary: Retoma uma sessão pausada
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
 *         description: Sessão retomada
 *       403:
 *         description: Sessão pertence a outro usuário
 *       404:
 *         description: Sessão não encontrada
 *       409:
 *         description: Sessão não está PAUSED
 *       500:
 *         description: Erro interno
 */
router.patch("/:id/resume", authMiddleware, sessionController.resume);

/**
 * @openapi
 * /api/sessions/{id}/finish:
 *   post:
 *     tags:
 *       - Sessão
 *     summary: Encerra uma sessão e aplica seus efeitos
 *     description: Fecha a sessão em uma única transação, calculando XP, nível, streak, revisão e avanço do ciclo.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [autoavaliacao]
 *             properties:
 *               autoavaliacao:
 *                 type: string
 *                 enum: [travei, ok, tranquilo]
 *               nota:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Sessão encerrada com sucesso
 *       401:
 *         description: Token não fornecido ou inválido
 *       403:
 *         description: Sessão pertence a outro usuário
 *       404:
 *         description: Sessão não encontrada
 *       409:
 *         description: Sessão não está running ou paused
 *       422:
 *         description: Autoavaliação ausente ou nota inválida
 *       500:
 *         description: Erro interno
 */
router.post(
  "/:id/finish",
  authMiddleware,
  validateBody(FinishSession),
  sessionController.finish,
);

export default router;
