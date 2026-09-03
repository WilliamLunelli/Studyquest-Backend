// DESATUALIZADO: fórmula antiga. Será reescrita no bloco C
// (sessão + gamificação). Não usar.
export function calcularXP(studyTime: number) {
  if (studyTime <= 10) {
    return studyTime * 1.1;
  } else if (studyTime > 10 && studyTime <= 30) {
    return studyTime * 1.3;
  } else {
    return studyTime * 1.5;
  }
}
