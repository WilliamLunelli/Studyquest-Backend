import * as z from "zod";

export const UserRegister = z.object({
  nome: z.string().trim().min(2).max(60),
  email: z.email(),
  senha: z.string().min(6),
});

export const UserLogin = z.object({
  email: z.email(),
  senha: z.string().min(1),
});
