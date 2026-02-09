import prisma from "../config/database";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwt";
import { LoginResponse } from "../types/user.types";

export async function createUser(
  email: string,
  username: string,
  password: string,
) {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("Email já existe");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      username,
      password: hashedPassword,
    },
  });

  return user;
}

export async function loginUser(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!existingUser) {
    throw new Error("Email ou senha incorretos");
  }

  const isValid = await bcrypt.compare(password, existingUser.password);

  if (!isValid) {
    throw new Error("Email ou senha incorretos");
  }

  const token = generateToken(existingUser.id);

  const result = {
    token,
    user: {
      id: existingUser.id,
      username: existingUser.username,
      email: existingUser.email,
      avatar: existingUser.avatar,
      bio: existingUser.bio,
      level: existingUser.level,
      xp: existingUser.xp,
    },
  };

  return result;
}
