export const getTodayDate = () => new Date().toISOString().split('T')[0];

export const getFormattedName = (student) => {
  if (!student) return '';
  const mi = student.middleInitial ? `${student.middleInitial}. ` : '';
  const suffix = student.suffix ? ` ${student.suffix}` : '';
  return `${student.firstName} ${mi}${student.lastName}${suffix}`;
};
