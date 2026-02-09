import * as z from "zod";

export const UserRegister = z.object({
  email: z.email(),
  username: z.string().min(3).max(20),
  password: z.string().min(6),
});

export const UserLogin = z.object({
  email: z.email(),
  password: z.string().min(1),
});
