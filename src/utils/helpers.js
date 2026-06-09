export const getTodayDate = () => new Date().toISOString().split('T')[0];

export const getFormattedName = (student) => {
  if (!student) return '';
  const suffix = student.suffix ? ` ${student.suffix}` : '';
  const mi = student.middleInitial ? `, ${student.middleInitial}.` : '';
  return `${student.lastName}${suffix}, ${student.firstName}${mi}`;
};

export const getInitials = (student) => {
  if (!student) return '👤';
  const first = student.firstName ? student.firstName.charAt(0) : '';
  const last = student.lastName ? student.lastName.charAt(0) : '';
  return (first + last).toUpperCase() || '👤';
};
