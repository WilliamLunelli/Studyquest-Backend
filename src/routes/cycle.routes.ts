import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { cycleController } from "../controllers/cycle.controller";
import { validateBody } from "../middlewares/validation.middleware";
import { UpdateCycleBlock } from "../validations/cycle.validation";

const router = Router();

/**
 * @openapi
 * /api/cycles/generate:
 *   post:
 *     tags:
 *       - Ciclo
 *     summary: Gera ou regenera o ciclo de estudos do usuario
 *     description: Usa objetivo, disponibilidade e dificuldades ja salvos. Ao regenerar, arquiva o ciclo ativo anterior.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Ciclo gerado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/StudyCycleResponse"
 *       401:
 *         description: Token nao fornecido ou invalido
 *       409:
 *         description: Onboarding incompleto ou nenhum assunto pendente disponivel
 *       500:
 *         description: Erro interno
 */
router.post("/generate", authMiddleware, cycleController.generate);

/**
 * @openapi
 * /api/cycles/current:
 *   get:
 *     tags:
 *       - Ciclo
 *     summary: Retorna o ciclo ativo com seus blocos
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ciclo ativo retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/StudyCycleResponse"
 *       401:
 *         description: Token nao fornecido ou invalido
 *       409:
 *         description: Nenhum ciclo ativo encontrado
 *       500:
 *         description: Erro interno
 */
router.get("/current", authMiddleware, cycleController.getCycles);

/**
 * @openapi
 * /api/cycles/blocks/{id}:
 *   patch:
 *     tags:
 *       - Ciclo
 *     summary: Edita duracao, materia, assunto ou posicao de um bloco
 *     description: Alterar ordem reordena os demais blocos automaticamente.
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
 *             $ref: "#/components/schemas/UpdateCycleBlock"
 *     responses:
 *       200:
 *         description: Bloco atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/CycleBlockResponse"
 *       400:
 *         description: ID invalido
 *       401:
 *         description: Token nao fornecido ou invalido
 *       404:
 *         description: Bloco do ciclo nao encontrado
 *       422:
 *         description: Dados invalidos ou assunto nao pertence a materia escolhida
 *       500:
 *         description: Erro interno
 */
router.patch(
  "/blocks/:id",
  authMiddleware,
  validateBody(UpdateCycleBlock),
  cycleController.updateCycle,
);

/**
 * @openapi
 * /api/cycles/blocks/{id}/complete:
 *   post:
 *     tags:
 *       - Ciclo
 *     summary: Marca um bloco do ciclo como concluido
 *     description: Concede XP quando o bloco passa de pendente para concluido e avanca o ponteiro do ciclo.
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
 *         description: Bloco concluido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/CompleteCycleBlockResponse"
 *       400:
 *         description: ID invalido
 *       401:
 *         description: Token nao fornecido ou invalido
 *       404:
 *         description: Bloco do ciclo nao encontrado
 *       500:
 *         description: Erro interno
 */
router.post(
  "/blocks/:id/complete",
  authMiddleware,
  cycleController.completeBlock,
);

/**
 * @openapi
 * /api/cycles/alignment:
 *   get:
 *     tags:
 *       - Ciclo
 *     summary: Compara minutos ideais e reais por materia
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Alinhamento retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/CycleAlignmentItem"
 *       401:
 *         description: Token nao fornecido ou invalido
 *       409:
 *         description: Onboarding incompleto
 *       500:
 *         description: Erro interno
 */
router.get("/alignment", authMiddleware, cycleController.alignment);

export default router;
