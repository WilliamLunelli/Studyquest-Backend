export function calcularXP(studyTime: number) {
  if (studyTime <= 10) {
    return studyTime * 1.1;
  } else if (studyTime > 10 && studyTime <= 30) {
    return studyTime * 1.3;
  } else {
    return studyTime * 1.5;
  }
}
