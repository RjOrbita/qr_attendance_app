import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export const exportWeeklyAttendance = async (masterLog) => {
  if (masterLog.length === 0) {
    Alert.alert("No Data", "There are no saved logs to export yet.");
    return;
  }

  const headerString = 'Date,Time,Status,Student LRN,Name\n';
  const rowString = masterLog.map(d => `"${d.date}","${d.time}","${d.status || 'Present'}","${d.id}","${d.name}"\n`).join('');
  const csvString = `${headerString}${rowString}`;

  const filename = `Classroom_Attendance_Export.csv`;
  const fileUri = `${FileSystem.cacheDirectory}${filename}`;

  try {
    await FileSystem.writeAsStringAsync(fileUri, csvString, { encoding: FileSystem.EncodingType.UTF8 });
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Export Weekly Attendance' });
    }
  } catch (error) {
    Alert.alert("Export Failed", error.message || String(error));
  }
};
