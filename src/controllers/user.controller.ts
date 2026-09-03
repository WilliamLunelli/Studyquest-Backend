import { Request, Response } from "express";
import * as userService from "../services/user.service";
import { handleControllerError } from "../utils/app-error";

export const registerController = async (req: Request, res: Response) => {
  try {
    const { nome, email, senha } = req.body;

    const result = await userService.createUser(email, nome, senha);

    return res.status(201).json(result);
  } catch (error) {
    return handleControllerError(error, res);
  }
};

export const loginController = async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body;

    const result = await userService.loginUser(email, senha);

    return res.status(200).json(result);
  } catch (error) {
    return handleControllerError(error, res);
  }
};

export const meController = async (req: Request, res: Response) => {
  try {
    const result = await userService.getMe(req.userId!);

    return res.status(200).json(result);
  } catch (error) {
    return handleControllerError(error, res);
  }
};
