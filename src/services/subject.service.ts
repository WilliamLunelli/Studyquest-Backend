import { areaRepository } from "../repositories/area.repository";
import { subjectRepostiory } from "../repositories/subject.repository";

export async function createSubject(
  areaId: string,
  subjectName: string,
  subjectDescription?: string,
) {
  const validateAreaId = await areaRepository.findAreaById(areaId);

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

export async function listSubjects(
  userId: string,
  query: any,
  areaId?: string,
) {
  if (areaId) {
    const validateAreaId = await areaRepository.findAreaById(areaId);

    if (!validateAreaId) {
      throw new Error("Essa área não está cadastrada.");
    }
  }

  const page = parseInt(query.page) || 1;
  const perPage = parseInt(query.perPage) || 10;
  const total = await subjectRepostiory.countSubjects(userId, areaId);
  const totalPages = Math.ceil(total / perPage);

  const skip = (page - 1) * perPage;
  const take = perPage;

  const data = await subjectRepostiory.getSubjectsById(
    userId,
    skip,
    take,
    areaId,
  );

  return { page, perPage, totalPages, total, data };
}

export async function getSubject(subjectId: string) {
  const data = await subjectRepostiory.getSubjectById(subjectId);

  return data;
}
