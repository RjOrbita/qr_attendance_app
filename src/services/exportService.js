import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { getFormattedName } from '../utils/helpers';

export const exportMonthlyAttendance = async (currentDate, masterLog, enrolledStudents, nonSchoolDays) => {
  if (enrolledStudents.length === 0) {
    Alert.alert("No Students", "Enroll students first to generate an attendance sheet.");
    return;
  }

  // Determine the start and end of the currently selected month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Create an array of date strings for the month (YYYY-MM-DD)
  const monthDates = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    monthDates.push(`${year}-${mm}-${dd}`);
  }

  // 1. Construct the Header Row
  // "LRN","Name","YYYY-MM-DD",...
  let headerString = '"LRN","Name",';
  headerString += monthDates.map(dateStr => `"${dateStr}"`).join(',') + '\n';

  // 2. Pre-compute day statuses to know which days are non-school days
  // map: dateString -> dayStatus ('Regular Class Day', 'Holiday', 'Class Suspended', 'Weekend')
  const dayStatusMap = {};
  monthDates.forEach(dateStr => {
    const d = new Date(dateStr);
    const nsdEntry = nonSchoolDays.find(n => n.date === dateStr);
    const anyLogsToday = masterLog.some(l => l.date === dateStr);
    
    if (nsdEntry) {
      dayStatusMap[dateStr] = nsdEntry.reason;
    } else if ((d.getDay() === 0 || d.getDay() === 6) && !anyLogsToday) {
      dayStatusMap[dateStr] = 'Weekend';
    } else {
      dayStatusMap[dateStr] = 'Regular Class Day';
    }
  });

  // 3. Construct rows for each student
  const sortedStudents = [...enrolledStudents].sort((a, b) => {
    const genderA = a.sex || 'Unknown';
    const genderB = b.sex || 'Unknown';
    const getGenderOrder = (g) => {
      if (g === 'Male') return 1;
      if (g === 'Female') return 2;
      return 3;
    };
    const orderA = getGenderOrder(genderA);
    const orderB = getGenderOrder(genderB);
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    const surnameCompare = (a.lastName || '').localeCompare(b.lastName || '', undefined, { sensitivity: 'base' });
    if (surnameCompare !== 0) return surnameCompare;
    return (a.firstName || '').localeCompare(b.firstName || '', undefined, { sensitivity: 'base' });
  });
  
  let rowsString = '';
  sortedStudents.forEach(student => {
    const suffix = student.suffix ? ` ${student.suffix}` : '';
    const mi = student.middleInitial ? `, ${student.middleInitial}` : '';
    const exportName = `${student.lastName}${suffix}, ${student.firstName}${mi}`;
    let row = `"${student.lrn}","${exportName}",`;
    
    const studentCols = monthDates.map(dateStr => {
      // Find log
      const log = masterLog.find(l => l.id === student.lrn && l.date === dateStr);
      if (log) {
        return log.status === 'Tardy' ? '"T"' : '"P"';
      }
      
      // Smart Absent Handling
      const status = dayStatusMap[dateStr];
      if (status !== 'Regular Class Day') {
        if (status === 'Weekend') return '"W"';
        if (status === 'Holiday') return '"H"';
        if (status === 'Class Suspended') return '"S"';
        return `"${status[0]}"`; // fallback
      }
      
      // If regular class day and no log, then Absent
      return '"A"';
    });
    
    row += studentCols.join(',') + '\n';
    rowsString += row;
  });

  const csvString = `${headerString}${rowsString}`;

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthName = monthNames[month];
  const filename = `Attendance_${monthName}_${year}.csv`;
  const fileUri = `${FileSystem.cacheDirectory}${filename}`;

  try {
    await FileSystem.writeAsStringAsync(fileUri, csvString, { encoding: FileSystem.EncodingType.UTF8 });
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: `Export ${monthName} Attendance` });
    }
  } catch (error) {
    Alert.alert("Export Failed", error.message || String(error));
  }
};
