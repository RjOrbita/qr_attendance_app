import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, Image, ScrollView, Alert } from 'react-native';
import { globalStyles as styles } from '../theme/styles';
import { getFormattedName } from '../utils/helpers';
import { exportWeeklyAttendance } from '../services/exportService';
import { clearLogs as clearStorageLogs } from '../services/storageService';
import { AppContext } from '../context/AppContext';

export default function HistoryScreen({ navigation }) {
  const { masterLog, setMasterLog, enrolledStudents } = useContext(AppContext);
  const [historyMode, setHistoryMode] = useState('byDate'); // 'byDate' | 'byStudent'
  const [historyDateIndex, setHistoryDateIndex] = useState(0);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [selectedHistoryStudent, setSelectedHistoryStudent] = useState(null);

  // --- DATA HELPERS ---
  const uniqueDates = [...new Set(masterLog.map(l => l.date))].sort((a, b) => b.localeCompare(a));
  const currentDate = uniqueDates[historyDateIndex];
  const recordsForDate = masterLog.filter(l => l.date === currentDate);

  const filteredStudents = studentSearchQuery.trim()
    ? enrolledStudents.filter(s =>
        getFormattedName(s).toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
        s.lrn.includes(studentSearchQuery)
      )
    : enrolledStudents;

  const getStudentWeekRecords = (student) => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push(d.toISOString().split('T')[0]);
    }
    return last7Days.map(date => ({
      date,
      record: masterLog.find(l => l.id === student.lrn && l.date === date) || null
    }));
  };

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
        <TouchableOpacity
          onPress={() => {
            if (selectedHistoryStudent) {
              setSelectedHistoryStudent(null);
            } else {
              navigation.goBack();
            }
          }}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>
            {selectedHistoryStudent ? '< Back to Search' : '< Back to Scanner'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.titleText}>
          {selectedHistoryStudent ? getFormattedName(selectedHistoryStudent) : 'Attendance Log'}
        </Text>

        {/* Mode Toggle - only when not in student detail */}
        {!selectedHistoryStudent && (
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeBtn, historyMode === 'byDate' && styles.modeBtnActive]}
              onPress={() => setHistoryMode('byDate')}
            >
              <Text style={[styles.modeBtnText, historyMode === 'byDate' && styles.modeBtnActiveText]}>📅 By Date</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, historyMode === 'byStudent' && styles.modeBtnActive]}
              onPress={() => setHistoryMode('byStudent')}
            >
              <Text style={[styles.modeBtnText, historyMode === 'byStudent' && styles.modeBtnActiveText]}>🔍 By Student</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── BY DATE MODE ── */}
      {!selectedHistoryStudent && historyMode === 'byDate' && (
        uniqueDates.length === 0
          ? <Text style={styles.emptyText}>No attendance records yet.</Text>
          : (
            <>
              {/* Date paginator */}
              <View style={styles.datePaginator}>
                <TouchableOpacity
                  style={[styles.pageArrow, historyDateIndex >= uniqueDates.length - 1 && styles.pageArrowDisabled]}
                  onPress={() => setHistoryDateIndex(i => Math.min(i + 1, uniqueDates.length - 1))}
                  disabled={historyDateIndex >= uniqueDates.length - 1}
                >
                  <Text style={styles.pageArrowText}>‹</Text>
                </TouchableOpacity>

                <View style={styles.dateDisplay}>
                  <Text style={styles.dateDisplayText}>{currentDate}</Text>
                  <Text style={styles.dateRecordCount}>
                    {recordsForDate.length} student{recordsForDate.length !== 1 ? 's' : ''} recorded
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.pageArrow, historyDateIndex === 0 && styles.pageArrowDisabled]}
                  onPress={() => setHistoryDateIndex(i => Math.max(i - 1, 0))}
                  disabled={historyDateIndex === 0}
                >
                  <Text style={styles.pageArrowText}>›</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.pageIndicator}>
                Page {historyDateIndex + 1} of {uniqueDates.length}
              </Text>

              <FlatList
                data={recordsForDate}
                keyExtractor={(item) => item.key}
                contentContainerStyle={styles.listContainer}
                renderItem={({item}) => (
                  <View style={styles.listItem}>
                    <View>
                      <Text style={styles.listName}>{item.name}</Text>
                      <Text style={styles.listSubText}>LRN: {item.id}</Text>
                      <Text style={[styles.statusBadge, item.status === 'Tardy' ? styles.statusTardy : styles.statusPresent]}>
                        {item.status || 'Present'}
                      </Text>
                    </View>
                    <Text style={styles.listTime}>{item.time}</Text>
                  </View>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>No records for this date.</Text>}
              />
            </>
          )
      )}

      {/* ── BY STUDENT MODE ── */}
      {!selectedHistoryStudent && historyMode === 'byStudent' && (
        <>
          <View style={styles.searchBarContainer}>
            <TextInput
              style={styles.searchBar}
              placeholder="🔍  Search by name or LRN..."
              placeholderTextColor="#64748B"
              value={studentSearchQuery}
              onChangeText={setStudentSearchQuery}
              clearButtonMode="while-editing"
            />
          </View>
          <FlatList
            data={filteredStudents}
            keyExtractor={(item) => item.lrn}
            contentContainerStyle={styles.listContainer}
            renderItem={({item}) => {
              const count = masterLog.filter(l => l.id === item.lrn).length;
              return (
                <TouchableOpacity style={styles.studentCard} onPress={() => setSelectedHistoryStudent(item)}>
                  <Image source={{ uri: item.photoUri }} style={styles.studentThumb} />
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentNameText}>{getFormattedName(item)}</Text>
                    <Text style={styles.studentLrnText}>LRN: {item.lrn}</Text>
                    <Text style={[styles.studentLrnText, {color: '#14B8A6', marginTop: 2}]}>
                      {count} record{count !== 1 ? 's' : ''} total
                    </Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={<Text style={styles.emptyText}>No students found.</Text>}
          />
        </>
      )}

      {/* ── STUDENT DETAIL (weekly view) ── */}
      {selectedHistoryStudent && (() => {
        const weekRecords = getStudentWeekRecords(selectedHistoryStudent);
        const allLogs = masterLog.filter(l => l.id === selectedHistoryStudent.lrn);
        const presentCount = allLogs.filter(l => (l.status || 'Present') !== 'Tardy').length;
        const tardyCount  = allLogs.filter(l => l.status === 'Tardy').length;

        return (
          <ScrollView contentContainerStyle={[styles.listContainer, {paddingBottom: 40}]}>
            {/* Profile card */}
            <View style={styles.studentProfileCard}>
              <Image source={{ uri: selectedHistoryStudent.photoUri }} style={styles.studentProfilePhoto} />
              <Text style={styles.studentProfileName}>{getFormattedName(selectedHistoryStudent)}</Text>
              <Text style={styles.studentProfileLrn}>LRN: {selectedHistoryStudent.lrn}</Text>
              <View style={styles.attendanceSummaryRow}>
                <View style={styles.summaryBadge}>
                  <Text style={styles.summaryBadgeNum}>{presentCount}</Text>
                  <Text style={styles.summaryBadgeLabel}>Present</Text>
                </View>
                <View style={[styles.summaryBadge, {borderColor: '#F59E0B'}]}>
                  <Text style={[styles.summaryBadgeNum, {color: '#F59E0B'}]}>{tardyCount}</Text>
                  <Text style={styles.summaryBadgeLabel}>Tardy</Text>
                </View>
                <View style={[styles.summaryBadge, {borderColor: '#3B82F6'}]}>
                  <Text style={[styles.summaryBadgeNum, {color: '#3B82F6'}]}>{allLogs.length}</Text>
                  <Text style={styles.summaryBadgeLabel}>Total</Text>
                </View>
              </View>
            </View>

            {/* This week */}
            <Text style={styles.sectionLabel}>This Week</Text>
            {weekRecords.map(({date, record}) => (
              <View key={date} style={styles.weekRow}>
                <View style={styles.weekDateBlock}>
                  <Text style={styles.weekDayText}>
                    {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                  </Text>
                  <Text style={styles.weekDateText}>{date}</Text>
                </View>
                {record ? (
                  <View style={styles.weekRecordBlock}>
                    <Text style={[styles.weekStatusDot, record.status === 'Tardy' ? {color:'#F59E0B'} : {color:'#14B8A6'}]}>●</Text>
                    <Text style={[styles.weekStatusText, record.status === 'Tardy' ? {color:'#F59E0B'} : {color:'#14B8A6'}]}>
                      {record.status || 'Present'}
                    </Text>
                    <Text style={styles.weekTimeText}>{record.time}</Text>
                  </View>
                ) : (
                  <View style={styles.weekRecordBlock}>
                    <Text style={{color:'#334155', fontSize:18}}>●</Text>
                    <Text style={{color:'#475569', fontSize:13, marginLeft:6}}>No record</Text>
                  </View>
                )}
              </View>
            ))}

            {/* All records */}
            <Text style={[styles.sectionLabel, {marginTop: 24}]}>All Records</Text>
            {allLogs.length === 0
              ? <Text style={styles.emptyText}>No records for this student.</Text>
              : [...allLogs].reverse().map(log => (
                <View key={log.key} style={styles.listItem}>
                  <View>
                    <Text style={styles.listDate}>{log.date}</Text>
                    <Text style={[styles.statusBadge, log.status === 'Tardy' ? styles.statusTardy : styles.statusPresent]}>
                      {log.status || 'Present'}
                    </Text>
                  </View>
                  <Text style={styles.listTime}>{log.time}</Text>
                </View>
              ))
            }
          </ScrollView>
        );
      })()}

      {/* Bottom action bar */}
      {!selectedHistoryStudent && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
            <Text style={styles.exportButtonText}>📤 Export Log</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearButton} onPress={clearWeeklyHistory}>
            <Text style={styles.clearButtonText}>🗑️ Clear</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
