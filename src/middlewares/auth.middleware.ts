import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token não fornecido" });
  }
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: "Token inválido" });
  }

  const payload = decoded as { userId: string };
  req.userId = payload.userId;
  return next();
}
