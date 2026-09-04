import { Request, Response } from "express";
import * as cycleService from "../services/cycle.service";
import { handleControllerError } from "../utils/app-error";

export const cycleController = {
  async generate(req: Request, res: Response) {
    try {
      const result = await cycleService.createCycle(req.userId!);

      return res.status(201).json(result);
    } catch (error) {
      return handleControllerError(error, res);
    }
  },

  async getCycles(req: Request, res: Response) {
    try {
      const result = await cycleService.getCurrentCycle(req.userId!);

      return res.status(200).json(result);
    } catch (error) {
      return handleControllerError(error, res);
    }
  },

  async updateCycle(req: Request<{ id: string }>, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: "ID inserido é inválido." });
      }

      const block = await cycleService.updateBlock(req.userId!, id, req.body);

      return res.status(200).json(block);
    } catch (error) {
      return handleControllerError(error, res);
    }
  },

  async completeBlock(req: Request<{ id: string }>, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: "ID inserido é inválido." });
      }

      const block = await cycleService.completeBlock(req.userId!, id);

      return res.status(200).json(block);
    } catch (error) {
      return handleControllerError(error, res);
    }
  },

  async alignment(req: Request, res: Response) {
    try {
      const result = await cycleService.getCycleAlignment(req.userId!);

      return res.status(200).json(result);
    } catch (error) {
      return handleControllerError(error, res);
    }
  },
};
