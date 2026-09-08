import { Request, Response, NextFunction } from "express";
import * as z from "zod";

export function validateBody(schema: z.ZodType<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      // 422: o corpo chegou bem formado, mas o conteúdo não passa nas
      // regras de validação (campo faltando, formato errado, fora do
      // intervalo permitido).
      if (error instanceof z.ZodError) {
        return res.status(422).json({
          message: "Dados inválidos.",
          errors: error.issues,
        });
      }

      return res.status(422).json({
        message: "Dados inválidos.",
      });
    }
  };
}
