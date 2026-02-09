import { Request, Response, NextFunction } from "express";
import * as z from "zod";

export function validateBody(schema: z.ZodType<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          errors: error.issues,
        });
      }

      return res.status(400).json({
        error: "Dados inválidos",
      });
    }
  };
}
