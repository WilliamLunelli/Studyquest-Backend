import { Request, Response } from "express";
import * as questionLogService from "../services/question-log.service";
import { handleControllerError } from "../utils/app-error";

export const questionLogController = {
  async create(req: Request, res: Response) {
    try {
      const result = await questionLogService.createQuestionLog(
        req.userId!,
        req.body,
      );

      return res.status(201).json(result);
    } catch (error) {
      return handleControllerError(error, res);
    }
  },

  async list(req: Request, res: Response) {
    try {
      const result = await questionLogService.listQuestionLogs(
        req.userId!,
        req.query,
      );

      return res.status(200).json(result);
    } catch (error) {
      return handleControllerError(error, res);
    }
  },
};
