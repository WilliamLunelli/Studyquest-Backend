import { Request, Response } from "express";
import * as sessionService from "../services/session.service";
import { handleControllerError } from "../utils/app-error";

export const sessionController = {
  async create(req: Request, res: Response) {
    try {
      const session = await sessionService.startSession(req.userId!, req.body);

      return res.status(201).json(session);
    } catch (error) {
      return handleControllerError(error, res);
    }
  },

  async getActive(req: Request, res: Response) {
    try {
      const session = await sessionService.getActiveSession(req.userId!);

      if (!session) {
        return res.status(204).send();
      }

      return res.status(200).json(session);
    } catch (error) {
      return handleControllerError(error, res);
    }
  },

  async pause(req: Request<{ id: string }>, res: Response) {
    try {
      const { id } = req.params;

      const session = await sessionService.pauseSession(req.userId!, id);

      return res.status(200).json(session);
    } catch (error) {
      return handleControllerError(error, res);
    }
  },

  async resume(req: Request<{ id: string }>, res: Response) {
    try {
      const { id } = req.params;

      const session = await sessionService.resumeSession(req.userId!, id);

      return res.status(200).json(session);
    } catch (error) {
      return handleControllerError(error, res);
    }
  },

  async finish(req: Request<{ id: string }>, res: Response) {
    try {
      const { id } = req.params;

      const session = await sessionService.finishSession(
        req.userId!,
        id,
        req.body,
      );

      return res.status(200).json(session);
    } catch (error) {
      return handleControllerError(error, res);
    }
  },
};
