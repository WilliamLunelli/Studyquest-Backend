import { Request, Response } from "express";
import * as areaService from "../services/area.service";
import { z } from "zod";

const createAreaSchema = z.object({
  areaName: z.string().trim().min(2).max(100),
  areaDescription: z.string().trim().max(500).optional(),
});

export const areaController = {
  async createArea(req: Request, res: Response) {
    try {
      const result = createAreaSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error.issues,
        });
      }

      const data = await areaService.createArea(
        req.userId!,
        result.data.areaName,
        result.data.areaDescription,
      );

      return res.status(201).json({ success: true, data });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Erro interno do servidor." });
    }
  },

  async listAreas(req: Request, res: Response) {
    try {
      const data = await areaService.listAreas(req.userId!);

      return res.status(200).json({ success: true, data });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Erro interno do servidor." });
    }
  },
};
