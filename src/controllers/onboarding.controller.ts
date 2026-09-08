import { Request, Response } from "express";
import * as onboardingService from "../services/onboarding.service";
import { handleControllerError } from "../utils/app-error";

export const onboardingController = {
  async setGoal(req: Request, res: Response) {
    try {
      const { goalId } = req.body;

      const result = await onboardingService.setGoal(req.userId!, goalId);

      return res.status(200).json(result);
    } catch (error) {
      return handleControllerError(error, res);
    }
  },

  async setAvailability(req: Request, res: Response) {
    try {
      const { disponibilidade } = req.body;

      const result = await onboardingService.setAvailability(
        req.userId!,
        disponibilidade,
      );

      return res.status(200).json(result);
    } catch (error) {
      return handleControllerError(error, res);
    }
  },

  async setDifficulties(req: Request, res: Response) {
    try {
      const { dificuldades } = req.body;

      const result = await onboardingService.setDifficulties(
        req.userId!,
        dificuldades,
      );

      return res.status(200).json(result);
    } catch (error) {
      return handleControllerError(error, res);
    }
  },
};
