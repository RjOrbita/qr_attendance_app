import React, { createContext, useState, useEffect } from 'react';
import { loadData, saveLogs, saveStudents, saveNonSchoolDays } from '../services/storageService';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [masterLog, setMasterLogState] = useState([]);
  const [enrolledStudents, setEnrolledStudentsState] = useState([]);
  const [nonSchoolDays, setNonSchoolDaysState] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    const { logs, students, nonSchoolDays: nsd } = await loadData();
    setMasterLogState(logs);
    setEnrolledStudentsState(students);
    setNonSchoolDaysState(nsd || []);
    setIsLoading(false);
  };

  const setMasterLog = async (newLogs) => {
    setMasterLogState(newLogs);
    await saveLogs(newLogs);
  };

  const setEnrolledStudents = async (newStudents) => {
    setEnrolledStudentsState(newStudents);
    await saveStudents(newStudents);
  };

  const setNonSchoolDays = async (newDays) => {
    setNonSchoolDaysState(newDays);
    await saveNonSchoolDays(newDays);
  };

  const updateStudentProfile = async (lrn, updatedData) => {
    const updatedStudents = enrolledStudents.map(student => {
      if (student.lrn === lrn) {
        return { ...student, ...updatedData };
      }
      return student;
    });
    await setEnrolledStudents(updatedStudents);
  };

  return (
    <AppContext.Provider value={{
      masterLog,
      setMasterLog,
      enrolledStudents,
      setEnrolledStudents,
      nonSchoolDays,
      setNonSchoolDays,
      updateStudentProfile,
      isLoading
    }}>
      {children}
    </AppContext.Provider>
  );
};
