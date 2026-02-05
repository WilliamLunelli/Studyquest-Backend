import { Request, Response } from "express";
import * as userService from "../services/user.service";

export const registerController = async (req: Request, res: Response) => {
  try {
    const { email, username, password } = req.body;

    const user = await userService.createUser(email, username, password);

    res.status(201).json({
      message: "usuário criado com sucesso",

      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Email já existe") {
        return res.status(400).json({ error: error.message });
      }
    }
    return res.status(500).json({ error: "erro interno" });
  }
};
