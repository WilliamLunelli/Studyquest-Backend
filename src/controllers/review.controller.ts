import { Request, Response } from "express";
import * as reviewService from "../services/review.service";
import { handleControllerError } from "../utils/app-error";

export const reviewController = {
  async today(req: Request, res: Response) {
    try {
      const result = await reviewService.getTodayReviews(req.userId!);

      return res.status(200).json(result);
    } catch (error) {
      return handleControllerError(error, res);
    }
  },

  async detail(req: Request<{ id: string }>, res: Response) {
    try {
      const result = await reviewService.getReviewDetail(
        req.userId!,
        req.params.id,
      );

      return res.status(200).json(result);
    } catch (error) {
      return handleControllerError(error, res);
    }
  },

  async upcoming(req: Request, res: Response) {
    try {
      const result = await reviewService.getUpcomingReviews(
        req.userId!,
        req.query,
      );

      return res.status(200).json(result);
    } catch (error) {
      return handleControllerError(error, res);
    }
  },
};
