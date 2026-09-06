import { Request, Response } from "express";
import * as dashboardService from "../services/dashboard.service";
import { handleControllerError } from "../utils/app-error";

export const dashboardController = {
  async get(req: Request, res: Response) {
    try {
      const result = await dashboardService.getDashboard(req.userId!, req.query);

      return res.status(200).json(result);
    } catch (error) {
      return handleControllerError(error, res);
    }
  },
};
