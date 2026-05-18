import { Router, Request, Response } from "express";
import prisma from "../config/database";

const router = Router();

router.post("/api/areas", async (req: Request, res: Response) => {
  try {
    const { userId, areaName, areaDescription } = req.body;

    if (!areaName) {
      return res.status(400).json({
        success: false,
        message: "areaName é obrigatório.",
      });
    }

    const area = await prisma.area.create({
      data: {
        userId,
        areaName,
        areaDescription,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Área criada com sucesso.",
      data: area,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Erro interno do servidor.",
    });
  }
});

export default router;
