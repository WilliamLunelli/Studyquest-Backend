import { Request, Response } from "express";
import * as goalService from "../services/goal.service";
import { handleControllerError } from "../utils/app-error";

export const goalController = {
  async list(req: Request, res: Response) {
    try {
      const tipo =
        typeof req.query.tipo === "string" ? req.query.tipo : undefined;

      const data = await goalService.listGoals(tipo);

      return res.status(200).json(data);
    } catch (error) {
      return handleControllerError(error, res);
    }
  },

  async weights(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const data = await goalService.getGoalWeights(id as string);

      return res.status(200).json(data);
    } catch (error) {
      return handleControllerError(error, res);
    }
  },
};
