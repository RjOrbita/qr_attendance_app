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

export const parseCSV = (text) => {
  const lines = [];
  let row = [""];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        row[row.length - 1] += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push("");
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // Skip \n
      }
      lines.push(row);
      row = [""];
    } else {
      row[row.length - 1] += char;
    }
  }
  if (row.length > 1 || row[0] !== "") {
    lines.push(row);
  }
  return lines;
};
