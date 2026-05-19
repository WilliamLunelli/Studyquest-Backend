import { areaRepository } from "../repositories/area.repository";

export async function createArea(
  userId: string,
  areaName: string,
  areaDescription?: string,
) {
  return areaRepository.createArea(userId, areaName, areaDescription);
}

export async function listAreas(userId: string) {
  return areaRepository.listAreas(userId);
}
