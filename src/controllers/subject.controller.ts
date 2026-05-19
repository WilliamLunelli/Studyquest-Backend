import { Request, Response } from "express";
import {
  createSubjectValidation,
  updateSubjectValidation,
} from "../validations/subject.validation";
import { areaRepository } from "../repositories/area.repository";
import * as subjectService from "../services/subject.service";
import { subjectRepostiory } from "../repositories/subject.repository";
import { dmmfToRuntimeDataModel } from "@prisma/client/runtime/library";

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
        req.userId!,
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

  async updateSubject(req: Request, res: Response) {
    try {
      const { subjectId } = req.params;

      if (typeof subjectId !== "string") {
        return res.status(400).json({
          success: false,
          message: "Não autorizado.",
        });
      }

      const existSubject = await subjectRepostiory.getSubjectById(subjectId);

      if (!existSubject) {
        return res.status(404).json({
          success: false,
          message: "subjectId inválido.",
        });
      }

      const userId = existSubject.area.userId;

      if (userId !== req.userId) {
        return res.status(403).json({
          success: false,
          message: "Não autorizado.",
        });
      }

      const result = updateSubjectValidation.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Erro na validação.",
          error: result.error.issues,
        });
      }

      if (result.data.areaId) {
        const area = await areaRepository.findAreaById(result.data.areaId);

        if (!area) {
          return res.status(404).json({
            success: false,
            message: "areaId inválido.",
          });
        }

        if (req.userId !== area.userId) {
          return res.status(403).json({
            success: false,
            message: "Acesso não autorizado.",
          });
        }
      }

      const data = await subjectRepostiory.updateSubject(
        subjectId,
        result.data,
      );

      return res.status(200).json({
        success: true,
        message: "Dados alterados com sucesso.",
        data,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro interno no servidor.",
      });
    }
  },

  async deleteSubject(req: Request, res: Response) {
    try {
      const { subjectId } = req.params;

      if (typeof subjectId !== "string") {
        return res.status(400).json({
          success: false,
          message: "subjectId inválido.",
        });
      }

      const data = await subjectRepostiory.getSubjectById(subjectId);

      if (!data) {
        return res.status(404).json({
          success: false,
          message: "subjectId não existe.",
        });
      }

      if (data.area.userId !== req.userId) {
        return res.status(403).json({
          success: false,
          message: "Não autorizado.",
        });
      }

      if (data.sessions.length !== 0) {
        return res.status(409).json({
          success: false,
          message: "Não é possível deletar materias vinculadas a sessões.",
        });
      }

      const deletedData = await subjectService.deleteSubject(subjectId);

      return res.status(200).json({
        success: true,
        message: "Matéria deletada com sucesso.",
        data: deletedData,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro interno no servidor.",
      });
    }
  },
};
