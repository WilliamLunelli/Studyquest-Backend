import * as homeService from "../services/home.service";
import { Request, Response } from "express";
import { handleControllerError } from "../utils/app-error";

export const homeController = {
  async get(req: Request, res: Response) {
    try {
      const result = await homeService.getHome(req.userId!);

      return res.status(200).json(result);
    } catch (error) {
      handleControllerError(error, res);
    }
  },
};
