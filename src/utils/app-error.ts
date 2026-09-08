import { Response } from "express";

/**
 * Erro com status HTTP embutido. O service lança `new AppError(401, "...")`,
 * o controller captura e responde com o status/mensagem certos — sem
 * precisar comparar texto de mensagem de erro pra decidir o status.
 */
export class AppError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}

/**
 * Catch padrão dos controllers: se for um erro de negócio (AppError),
 * responde com o status/mensagem que o service definiu. Qualquer outro
 * erro é inesperado — vira 500 sem vazar detalhe pro cliente.
 */
export function handleControllerError(error: unknown, res: Response) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  console.error(error);
  return res.status(500).json({ message: "Erro interno do servidor." });
}
