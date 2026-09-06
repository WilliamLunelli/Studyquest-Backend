import { Router } from "express";
import { reviewController } from "../controllers/review.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @openapi
 * /api/reviews/today:
 *   get:
 *     tags:
 *       - Revisao
 *     summary: Revisoes pendentes de hoje e atrasadas
 *     description: Retorna atrasadas primeiro, da mais antiga para a mais recente, e depois as revisoes de hoje.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Revisoes retornadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/ReviewListItem"
 *       401:
 *         description: Token nao fornecido ou invalido
 *       500:
 *         description: Erro interno
 */
router.get("/today", authMiddleware, reviewController.today);

/**
 * @openapi
 * /api/reviews/upcoming:
 *   get:
 *     tags:
 *       - Revisao
 *     summary: Proximas revisoes agendadas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dias
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 60
 *           default: 7
 *     responses:
 *       200:
 *         description: Revisoes futuras retornadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/ReviewListItem"
 *       401:
 *         description: Token nao fornecido ou invalido
 *       422:
 *         description: Parametro dias invalido
 *       500:
 *         description: Erro interno
 */
router.get("/upcoming", authMiddleware, reviewController.upcoming);

/**
 * @openapi
 * /api/reviews/{id}:
 *   get:
 *     tags:
 *       - Revisao
 *     summary: Detalhe da revisao com roteiro de recuperacao ativa
 *     description: Retorna roteiro estatico por tipo de materia. Nao usa IA.
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
 *         description: Revisao retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ReviewDetailResponse"
 *       401:
 *         description: Token nao fornecido ou invalido
 *       404:
 *         description: Revisao nao encontrada
 *       500:
 *         description: Erro interno
 */
router.get("/:id", authMiddleware, reviewController.detail);

export default router;
