import React, { useState, useContext, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { globalStyles as styles } from '../theme/styles';
import { getFormattedName } from '../utils/helpers';
import { exportWeeklyAttendance } from '../services/exportService';
import { clearLogs as clearStorageLogs } from '../services/storageService';
import { AppContext } from '../context/AppContext';

export default function HistoryScreen({ navigation }) {
  const { masterLog, setMasterLog, enrolledStudents } = useContext(AppContext);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Helper to format date like Jun 09, 2026
  const formatDateHeader = (d) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${month} ${day}, ${year}`;
  };

  const formatDayOfWeek = (d) => {
    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return weekdays[d.getDay()];
  };

  // Helper to get ISO date string (YYYY-MM-DD) for matching with masterLog
  const getIsoDateString = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isoCurrentDate = getIsoDateString(currentDate);

  const incrementDate = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const decrementDate = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setCurrentDate(selectedDate);
    }
  };

  const toggleManualAttendance = (student) => {
    const rec = student.attendanceRecord;
    const studentName = getFormattedName(student);
    
    Alert.alert(
      "Manual Attendance",
      `Update attendance for ${studentName} on ${formatDateHeader(currentDate)}:`,
      [
        { 
          text: "Mark Present", 
          onPress: () => saveManualStatus(student.lrn, studentName, 'Present') 
        },
        { 
          text: "Mark Tardy", 
          onPress: () => saveManualStatus(student.lrn, studentName, 'Tardy') 
        },
        { 
          text: "Mark Absent (Remove)", 
          style: "destructive",
          onPress: () => saveManualStatus(student.lrn, studentName, 'Absent') 
        },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const saveManualStatus = async (lrn, name, status) => {
    let updatedLogs = [...masterLog];
    // Filter out existing logs for this student on this date
    updatedLogs = updatedLogs.filter(l => !(l.id === lrn && l.date === isoCurrentDate));
    
    if (status !== 'Absent') {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newLog = {
        id: lrn,
        name,
        time: timeStr,
        date: isoCurrentDate,
        status,
        key: `${lrn}-${Date.now()}`
      };
      updatedLogs.push(newLog);
    }
    
    await setMasterLog(updatedLogs);
  };

  const listData = useMemo(() => {
    return enrolledStudents
      .map(student => {
        const record = masterLog.find(l => l.id === student.lrn && l.date === isoCurrentDate);
        return {
          ...student,
          attendanceRecord: record || null
        };
      })
      .sort((a, b) => (a.lastName || '').localeCompare(b.lastName || ''));
  }, [enrolledStudents, masterLog, isoCurrentDate]);

  const handleExport = () => {
    exportWeeklyAttendance(masterLog);
  };

  const clearWeeklyHistory = () => {
    Alert.alert("Reset History?", "Permanently clear all saved attendance?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear Everything", style: "destructive", onPress: async () => {
          await clearStorageLogs();
          await setMasterLog([]);
          Alert.alert("Cleared", "All records reset.");
      }}
    ]);
  };

  return (
    <View style={styles.container}>
      {/* ── HEADER ── */}
      <View style={styles.headerArea}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{'< Back to Scanner'}</Text>
        </TouchableOpacity>
        <Text style={styles.titleText}>Attendance Log</Text>
      </View>

      {/* ── DATE SELECTOR ── */}
      <View style={styles.datePaginator}>
        <TouchableOpacity style={styles.pageArrow} onPress={decrementDate}>
          <Text style={styles.pageArrowText}>‹</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dateDisplay} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateDisplayText}>{formatDateHeader(currentDate)}</Text>
          <Text style={styles.dateRecordCount}>{formatDayOfWeek(currentDate)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.pageArrow} onPress={incrementDate}>
          <Text style={styles.pageArrowText}>›</Text>
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={currentDate}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      {/* ── STUDENT LIST FOR SELECTED DATE ── */}
      <FlatList
        data={listData}
        keyExtractor={(item) => item.lrn}
        contentContainerStyle={styles.listContainer}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        renderItem={({item}) => {
          const rec = item.attendanceRecord;
          const status = rec ? (rec.status || 'Present') : 'Absent';
          
          let statusStyle = styles.statusPresent;
          if (status === 'Tardy') statusStyle = styles.statusTardy;
          if (status === 'Absent') statusStyle = { ...styles.statusBadge, backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.3)' };

          return (
            <TouchableOpacity 
              style={[styles.listItem, { paddingVertical: 10, paddingHorizontal: 15, marginBottom: 8 }]}
              onPress={() => navigation.navigate('StudentProfile', { lrn: item.lrn, initialTab: 'History' })}
            >
              <View style={{flex: 1}}>
                <Text style={[styles.listName, { fontSize: 15 }]}>{getFormattedName(item)}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Text style={[styles.statusBadge, statusStyle, { marginTop: 0 }]}>
                    {status}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => toggleManualAttendance(item)}
                    style={{ marginLeft: 10, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#334155' }}
                  >
                    <Text style={{ color: '#14B8A6', fontSize: 11, fontWeight: 'bold' }}>✎ Edit</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Text style={[styles.listTime, { marginRight: 8, fontSize: 13 }]}>{rec ? rec.time : '--:--'}</Text>
                <Text style={[styles.chevron, { fontSize: 20 }]}>›</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={styles.emptyText}>No students enrolled.</Text>}
      />

      {/* ── BOTTOM BAR ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
          <Text style={styles.exportButtonText}>📤 Export Log</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.clearButton} onPress={clearWeeklyHistory}>
          <Text style={styles.clearButtonText}>🗑️ Clear</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
