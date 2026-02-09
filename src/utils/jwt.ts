import * as jwt from "jsonwebtoken";

export function generateToken(userId: string): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET não configurado");
  }

  const expiresIn = process.env.JWT_EXPIRES_IN ?? "7d";

  return jwt.sign({ userId }, secret, { expiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET não configurado");
  }

  try {
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}
