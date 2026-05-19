import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { subjectController } from "../controllers/subject.controller";

const router = Router();

/**
 * @openapi
 * /api/subject/{areaId}:
 *   post:
 *     tags:
 *       - Materias
 *     summary: Criar materia em uma area
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: areaId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/CreateSubject"
 *     responses:
 *       200:
 *         description: Materia criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: "#/components/schemas/Subject"
 *       400:
 *         description: Dados invalidos
 *       401:
 *         description: Token nao fornecido, invalido ou areaId invalido
 *       403:
 *         description: Usuario nao autorizado
 *       404:
 *         description: Area nao encontrada
 *       500:
 *         description: Erro interno
 */
router.post("/:areaId", authMiddleware, subjectController.createSubject);

/**
 * @openapi
 * /api/subject/list-subjects:
 *   get:
 *     tags:
 *       - Materias
 *     summary: Listar materias do usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: areaId
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: query
 *         name: perPage
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: Lista de materias retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 listResult:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     perPage:
 *                       type: integer
 *                       example: 10
 *                     totalPages:
 *                       type: integer
 *                       example: 1
 *                     total:
 *                       type: integer
 *                       example: 1
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             example: a1b2c3d4-0000-0000-0000-000000000000
 *                           areaName:
 *                             type: string
 *                             example: Exatas
 *                           areaDescription:
 *                             type: string
 *                             example: Materias de calculo e raciocinio logico
 *                           subjects:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                   format: uuid
 *                                   example: b1c2d3e4-0000-0000-0000-000000000000
 *                                 subjectName:
 *                                   type: string
 *                                   example: Matematica
 *                                 subjectDescription:
 *                                   type: string
 *                                   example: Algebra e geometria
 *       404:
 *         description: Area nao encontrada
 *       500:
 *         description: Erro interno
 */
router.get(
  "/list-subjects",
  authMiddleware,
  subjectController.listSubjects,
);

/**
 * @openapi
 * /api/subject/get-subject/{subjectId}:
 *   get:
 *     tags:
 *       - Materias
 *     summary: Buscar materia por ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subjectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Materia retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: "#/components/schemas/Subject"
 *       400:
 *         description: subjectId invalido
 *       403:
 *         description: Usuario nao autorizado
 *       500:
 *         description: Erro interno
 */
router.get(
  "/get-subject/:subjectId",
  authMiddleware,
  subjectController.getSubject,
);

/**
 * @openapi
 * /api/subject/update-subject/{subjectId}:
 *   put:
 *     tags:
 *       - Materias
 *     summary: Atualizar materia
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subjectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/UpdateSubject"
 *     responses:
 *       200:
 *         description: Materia atualizada com sucesso
 *       400:
 *         description: Dados invalidos
 *       403:
 *         description: Usuario nao autorizado
 *       404:
 *         description: Materia ou area nao encontrada
 *       500:
 *         description: Erro interno
 */
router.put(
  "/update-subject/:subjectId",
  authMiddleware,
  subjectController.updateSubject,
);

/**
 * @openapi
 * /api/subject/delete-subject/{subjectId}:
 *   delete:
 *     tags:
 *       - Materias
 *     summary: Deletar materia
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subjectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Materia deletada com sucesso
 *       400:
 *         description: subjectId invalido
 *       403:
 *         description: Usuario nao autorizado
 *       404:
 *         description: Materia nao encontrada
 *       409:
 *         description: Materia possui sessoes vinculadas
 *       500:
 *         description: Erro interno
 */
router.delete(
  "/delete-subject/:subjectId",
  authMiddleware,
  subjectController.deleteSubject,
);
export default router;
