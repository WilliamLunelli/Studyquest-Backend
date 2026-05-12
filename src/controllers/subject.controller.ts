import { Request, Response } from "express";
import { createSubjectValidation } from "../validations/subject.validation";
import { areaRepository } from "../repositories/area.repository";

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

      return res.status(200).json({
        success: true,
        data: createSubjectSchema.data,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor.",
      });
    }
  },
};
