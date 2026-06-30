import React, { useState, useContext, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { globalStyles as styles } from '../theme/styles';
import { getFormattedName } from '../utils/helpers';
import { exportMonthlyAttendance } from '../services/exportService';
import { clearLogs as clearStorageLogs } from '../services/storageService';
import { AppContext } from '../context/AppContext';

export default function HistoryScreen({ navigation }) {
  const { masterLog, setMasterLog, enrolledStudents, nonSchoolDays, setNonSchoolDays } = useContext(AppContext);
  const insets = useSafeAreaInsets();
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

  const getIsoDateString = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isoCurrentDate = getIsoDateString(currentDate);

  const anyLogsToday = useMemo(() => masterLog.some(l => l.date === isoCurrentDate), [masterLog, isoCurrentDate]);
  const nsdEntry = useMemo(() => nonSchoolDays.find(d => d.date === isoCurrentDate), [nonSchoolDays, isoCurrentDate]);
  
  let dayStatus = 'Regular Class Day';
  if (nsdEntry) {
    dayStatus = nsdEntry.reason;
  } else if ((currentDate.getDay() === 0 || currentDate.getDay() === 6) && !anyLogsToday) {
    dayStatus = 'Weekend';
  }

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

  const getDayStatusColor = (status) => {
    switch (status) {
      case 'Regular Class Day':
        return '#14B8A6'; // Teal
      case 'Holiday':
        return '#F59E0B'; // Amber
      case 'Class Suspended':
        return '#EF4444'; // Red
      case 'Weekend':
        return '#94A3B8'; // Gray
      default:
        return '#FFF';
    }
  };

  const toggleDayStatus = () => {
    Alert.alert(
      "Set Day Status",
      `Mark ${formatDateHeader(currentDate)} as:`,
      [
        { text: "Regular Class Day", onPress: () => updateDayStatus('Regular Class Day') },
        { text: "Holiday", onPress: () => updateDayStatus('Holiday') },
        { text: "Class Suspended", onPress: () => updateDayStatus('Class Suspended') },
        { text: "Cancel", style: "cancel" }
      ],
      { cancelable: true }
    );
  };

  const updateDayStatus = async (status) => {
    let updatedNsd = nonSchoolDays.filter(d => d.date !== isoCurrentDate);
    if (status !== 'Regular Class Day') {
      updatedNsd.push({ date: isoCurrentDate, reason: status });
    }
    await setNonSchoolDays(updatedNsd);
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
      ],
      { cancelable: true }
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
      .sort((a, b) => {
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
  }, [enrolledStudents, masterLog, isoCurrentDate]);

  const handleExport = () => {
    exportMonthlyAttendance(currentDate, masterLog, enrolledStudents, nonSchoolDays);
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
      <View style={[styles.headerArea, { paddingBottom: 15 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{'< Back to Scanner'}</Text>
        </TouchableOpacity>
        <Text style={styles.titleText}>Attendance Log</Text>

        {/* Date Selector Row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15 }}>
          <TouchableOpacity 
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#334155' }} 
            onPress={decrementDate}
          >
            <Text style={{ color: '#14B8A6', fontSize: 24, fontWeight: 'bold', lineHeight: 28 }}>‹</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ alignItems: 'center' }} onPress={() => setShowDatePicker(true)}>
            <Text style={{ color: '#FFF', fontSize: 20, fontWeight: 'bold' }}>{formatDateHeader(currentDate)}</Text>
            <Text style={{ color: '#14B8A6', fontSize: 13, marginTop: 2 }}>{formatDayOfWeek(currentDate)}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#334155' }} 
            onPress={incrementDate}
          >
            <Text style={{ color: '#14B8A6', fontSize: 24, fontWeight: 'bold', lineHeight: 28 }}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Day Status selector under date selector */}
        <View style={{ alignItems: 'center', marginTop: 15 }}>
          <TouchableOpacity 
            onPress={toggleDayStatus} 
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 12,
              backgroundColor: '#0F172A',
              borderWidth: 1,
              borderColor: dayStatus === 'Regular Class Day' ? '#334155' : getDayStatusColor(dayStatus)
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: getDayStatusColor(dayStatus) }}>
              {dayStatus === 'Regular Class Day' ? '📅 Regular Class Day' : 
               dayStatus === 'Holiday' ? '🏖️ Holiday' : 
               dayStatus === 'Class Suspended' ? '🚫 Suspended' : `🛋️ ${dayStatus}`}
            </Text>
            <Text style={{ color: '#94A3B8', fontSize: 10 }}>  ▼</Text>
          </TouchableOpacity>
        </View>
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
        contentContainerStyle={[styles.listContainer, { paddingBottom: 100 + insets.bottom }]}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        renderItem={({item, index}) => {
          const showHeader = index === 0 || item.sex !== listData[index - 1].sex;
          const genderTitle = item.sex === 'Male' ? 'Male Students' : item.sex === 'Female' ? 'Female Students' : 'Other / Not Specified';

          const rec = item.attendanceRecord;
          let status = 'Absent';
          if (rec) {
            status = rec.status || 'Present';
          } else if (dayStatus !== 'Regular Class Day') {
            status = dayStatus;
          }
          
          let statusStyle = styles.statusPresent;
          if (status === 'Tardy') statusStyle = styles.statusTardy;
          else if (status === 'Absent') statusStyle = { ...styles.statusBadge, backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.3)' };
          else if (status !== 'Present') statusStyle = { ...styles.statusBadge, backgroundColor: 'rgba(100, 116, 139, 0.2)', color: '#94A3B8', borderColor: 'rgba(100, 116, 139, 0.3)' };

          return (
            <View>
              {showHeader && (
                <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: index === 0 ? 4 : 18, marginBottom: 8, marginLeft: 4, textTransform: 'uppercase' }}>
                  {genderTitle}
                </Text>
              )}
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
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.emptyText}>No students enrolled.</Text>}
      />

      {/* ── BOTTOM BAR ── */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
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

