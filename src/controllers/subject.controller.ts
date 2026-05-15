import { Request, Response } from "express";
import { createSubjectValidation } from "../validations/subject.validation";
import { areaRepository } from "../repositories/area.repository";
import * as subjectService from "../services/subject.service";
import { userRepository } from "../repositories/user.repository";

export const subjectController = {
  async createSubject(req: Request, res: Response) {
    try {
      const { areaId } = req.params;

      const { subjectName, subjectDescription } = req.body;

      if (typeof areaId !== "string") {
        return res.status(401).json({
          success: false,
          message: "areaId inválido.",
        });
      }

      const existAreaId = await areaRepository.findAreaById(areaId);

      if (!existAreaId) {
        return res.status(404).json({
          success: false,
          message: "areaId não existe",
        });
      }

      const userId = existAreaId.userId;

      if (userId !== req.userId) {
        return res.status(403).json({
          success: false,
          message: "Não autorizado.",
        });
      }

      const createSubjectSchema = createSubjectValidation.safeParse({
        areaId,
        subjectName,
        subjectDescription,
      });

      if (!createSubjectSchema.success) {
        return res.status(400).json({
          success: false,
          error: createSubjectSchema.error.issues,
        });
      }

      const data = await subjectService.createSubject(
        createSubjectSchema.data.areaId,
        createSubjectSchema.data.subjectName,
        createSubjectSchema.data.subjectDescription,
      );

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor.",
      });
    }
  },

  async listSubjects(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      if (typeof userId !== "string") {
        return res.status(400).json({
          success: false,
          message: "userId inválido.",
        });
      }

      if (req.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: "Não autorizado.",
        });
      }

      const areaId = String(req.query.areaId ?? "");

      if (areaId !== "") {
        const existAreaId = await areaRepository.findAreaById(areaId);

        if (!existAreaId) {
          return res.status(404).json({
            success: false,
            message: "areaId não existe",
          });
        }
      }

      const page = String(req.query.page ?? "");
      const perPage = String(req.query.perPage ?? "");

      const query = { page, perPage };

      const listResult = await subjectService.listSubjects(
        req.userId,
        query,
        areaId,
      );

      return res.status(200).json({
        success: true,
        listResult,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor.",
      });
    }
  },

  async getSubject(req: Request, res: Response) {
    try {
      const { subjectId } = req.params;

      if (typeof subjectId !== "string") {
        return res.status(400).json({
          success: false,
          message: "subjectId inserido é inválido.",
        });
      }

      const data = await subjectService.getSubject(subjectId);

      if (data?.area.userId !== req.userId) {
        return res.status(403).json({
          success: false,
          message: "Não autorizado.",
        });
      }

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor.",
      });
    }
  },
};
