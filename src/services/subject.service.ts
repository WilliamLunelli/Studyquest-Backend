import { areaRepository } from "../repositories/area.repository";
import { subjectRepostiory } from "../repositories/subject.repository";

export async function createSubject(
  areaId: string,
  subjectName: string,
  subjectDescription?: string,
) {
  const validateAreaId = areaRepository.findAreaById(areaId);

  if (!validateAreaId) {
    throw new Error("Essa área não está cadastrada.");
  }

  const data = await subjectRepostiory.createSubject(
    areaId,
    subjectName,
    subjectDescription,
  );

  return data;
}
