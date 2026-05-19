import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { areaController } from "../controllers/area.controller";

const router = Router();

/**
 * @openapi
 * /api/areas:
 *   post:
 *     tags:
 *       - Areas
 *     summary: Criar uma nova area de estudo
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/CreateArea"
 *     responses:
 *       201:
 *         description: Area criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: "#/components/schemas/Area"
 *       400:
 *         description: Dados invalidos
 *       401:
 *         description: Token nao fornecido ou invalido
 *       500:
 *         description: Erro interno
 */
router.post("/", authMiddleware, areaController.createArea);

/**
 * @openapi
 * /api/areas:
 *   get:
 *     tags:
 *       - Areas
 *     summary: Listar areas do usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de areas retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/Area"
 *       401:
 *         description: Token nao fornecido ou invalido
 *       500:
 *         description: Erro interno
 */
router.get("/", authMiddleware, areaController.listAreas);

export default router;
