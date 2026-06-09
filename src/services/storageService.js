import AsyncStorage from '@react-native-async-storage/async-storage';

const LOGS_KEY = 'classroom_attendance_master';
const STUDENTS_KEY = 'enrolled_students';
const NON_SCHOOL_DAYS_KEY = 'classroom_non_school_days';

export const loadData = async () => {
  try {
    const savedLogs = await AsyncStorage.getItem(LOGS_KEY);
    const parsedLogs = savedLogs ? JSON.parse(savedLogs) : [];
    
    const savedStudents = await AsyncStorage.getItem(STUDENTS_KEY);
    const parsedStudents = savedStudents ? JSON.parse(savedStudents) : [];
    
    const savedNonSchoolDays = await AsyncStorage.getItem(NON_SCHOOL_DAYS_KEY);
    const parsedNonSchoolDays = savedNonSchoolDays ? JSON.parse(savedNonSchoolDays) : [];
    
    return { logs: parsedLogs, students: parsedStudents, nonSchoolDays: parsedNonSchoolDays };
  } catch (err) {
    console.error("Error loading data:", err);
    return { logs: [], students: [], nonSchoolDays: [] };
  }
};

export const saveLogs = async (logs) => {
  try {
    await AsyncStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  } catch (err) {
    console.error("Error saving logs:", err);
  }
};

export const saveStudents = async (students) => {
  try {
    await AsyncStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
  } catch (err) {
    console.error("Error saving students:", err);
  }
};

export const saveNonSchoolDays = async (days) => {
  try {
    await AsyncStorage.setItem(NON_SCHOOL_DAYS_KEY, JSON.stringify(days));
  } catch (err) {
    console.error("Error saving non school days:", err);
  }
};

export const clearLogs = async () => {
  try {
    await AsyncStorage.removeItem(LOGS_KEY);
  } catch (err) {
    console.error("Error clearing logs:", err);
  }
};
