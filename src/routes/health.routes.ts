import { Router } from "express";

const router = Router();

/**
 * @openapi
 * /api/health/health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Verificar se o servidor esta online
 *     responses:
 *       200:
 *         description: Servidor online
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 */
router.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

export default router;
