import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Animated, FlatList, TextInput, Image, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  
  // Data States
  const [masterLog, setMasterLog] = useState([]);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  
  // Scanner States
  const [scannedStudent, setScannedStudent] = useState(null);
  const [scanTime, setScanTime] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('Present');
  
  // Navigation State: 'scanner', 'history', 'manageStudents', 'enrollStudent'
  const [currentScreen, setCurrentScreen] = useState('scanner');

  // Enrollment Form State
  const [enrollForm, setEnrollForm] = useState({
    lrn: '', lastName: '', firstName: '', middleInitial: '', suffix: '', phone: '', photoUri: null
  });

  const pulseAnim = useRef(new Animated.Value(1)).current;

  const getTodayDate = () => new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
    loadData();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
      ])
    ).start();
  }, [permission, pulseAnim]);

  const loadData = async () => {
    try {
      const savedLogs = await AsyncStorage.getItem('classroom_attendance_master');
      if (savedLogs) setMasterLog(JSON.parse(savedLogs));
      
      const savedStudents = await AsyncStorage.getItem('enrolled_students');
      if (savedStudents) setEnrolledStudents(JSON.parse(savedStudents));
    } catch (err) {
      console.error("Error loading data:", err);
    }
  };

  const getFormattedName = (student) => {
    const mi = student.middleInitial ? `${student.middleInitial}. ` : '';
    const suffix = student.suffix ? ` ${student.suffix}` : '';
    return `${student.firstName} ${mi}${student.lastName}${suffix}`;
  };

  // --- SCANNER LOGIC ---
  const handleBarCodeScanned = ({ data }) => {
    const scannedLrn = data.trim();
    
    // Silent fail if LRN not found in enrolled students
    const student = enrolledStudents.find(s => s.lrn === scannedLrn);
    if (!student) return;

    // Check if already logged today
    const isAlreadyCheckedInToday = masterLog.some(
      log => log.id === student.lrn && log.date === getTodayDate()
    );
    
    if (isAlreadyCheckedInToday) {
      Alert.alert("Already Checked In", `${getFormattedName(student)} is already logged for today.`);
      setTimeout(() => setScannedStudent(null), 2000); 
      return;
    }

    // Trigger confirmation modal
    setSelectedStatus('Present');
    setScanTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setScannedStudent(student);
  };

  const confirmAttendance = async (status) => {
    const newLog = {
      id: scannedStudent.lrn,
      name: getFormattedName(scannedStudent),
      time: scanTime,
      date: getTodayDate(),
      status: status, // 'Present' or 'Tardy'
      key: `${scannedStudent.lrn}-${Date.now()}`
    };

    const updatedMaster = [...masterLog, newLog];
    setMasterLog(updatedMaster);
    await AsyncStorage.setItem('classroom_attendance_master', JSON.stringify(updatedMaster));
    
    setScannedStudent(null);
    setScanTime(null);
  };

  // --- ENROLLMENT LOGIC ---
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setEnrollForm({ ...enrollForm, photoUri: result.assets[0].uri });
    }
  };

  const handleEnrollStudent = async () => {
    if (!enrollForm.lrn || !enrollForm.lastName || !enrollForm.firstName || !enrollForm.photoUri) {
      Alert.alert("Missing Fields", "LRN, Last Name, First Name, and Photo are required.");
      return;
    }

    if (enrolledStudents.some(s => s.lrn === enrollForm.lrn)) {
      Alert.alert("Duplicate LRN", "A student with this LRN is already enrolled.");
      return;
    }

    try {
      // Persist image
      const filename = enrollForm.photoUri.split('/').pop();
      const persistentPhotoUri = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.copyAsync({
        from: enrollForm.photoUri,
        to: persistentPhotoUri
      });

      const newStudent = { ...enrollForm, photoUri: persistentPhotoUri };
      const updatedStudents = [...enrolledStudents, newStudent];
      setEnrolledStudents(updatedStudents);
      await AsyncStorage.setItem('enrolled_students', JSON.stringify(updatedStudents));
      
      Alert.alert("Success", "Student enrolled successfully!");
      setEnrollForm({ lrn: '', lastName: '', firstName: '', middleInitial: '', suffix: '', phone: '', photoUri: null });
      setCurrentScreen('manageStudents');
    } catch (err) {
      Alert.alert("Error", "Failed to save student data.");
      console.error(err);
    }
  };

  const deleteStudent = (lrn) => {
    Alert.alert("Remove Student", "Are you sure you want to remove this student?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => {
          const updated = enrolledStudents.filter(s => s.lrn !== lrn);
          setEnrolledStudents(updated);
          await AsyncStorage.setItem('enrolled_students', JSON.stringify(updated));
      }}
    ]);
  };

  // --- EXPORT/CLEAR LOGIC ---
  const exportWeeklyAttendance = async () => {
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

  const clearWeeklyHistory = () => {
    Alert.alert("Reset History?", "Permanently clear all saved attendance?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear Everything", style: "destructive", onPress: async () => {
          await AsyncStorage.removeItem('classroom_attendance_master');
          setMasterLog([]);
          Alert.alert("Cleared", "All records reset.");
      }}
    ]);
  };

  // --- RENDER SCREENS ---
  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', color: '#64748B', marginBottom: 20 }}>Camera permissions are required.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Grant Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (currentScreen === 'history') {
    return (
      <View style={styles.container}>
        <View style={styles.headerArea}>
          <TouchableOpacity onPress={() => setCurrentScreen('scanner')} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back to Scanner</Text>
          </TouchableOpacity>
          <Text style={styles.titleText}>Attendance Log</Text>
        </View>

        <FlatList 
          data={[...masterLog].reverse()} 
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
              <View style={{alignItems: 'flex-end'}}>
                <Text style={styles.listDate}>{item.date}</Text>
                <Text style={styles.listTime}>{item.time}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No students scanned yet.</Text>}
        />

        <View style={styles.bottomBar}>
           <TouchableOpacity style={styles.exportButton} onPress={exportWeeklyAttendance}>
              <Text style={styles.exportButtonText}>📤 Export Log</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.clearButton} onPress={clearWeeklyHistory}>
              <Text style={styles.clearButtonText}>🗑️ Clear</Text>
            </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (currentScreen === 'manageStudents') {
    return (
      <View style={styles.container}>
        <View style={styles.headerArea}>
          <TouchableOpacity onPress={() => setCurrentScreen('scanner')} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back to Scanner</Text>
          </TouchableOpacity>
          <Text style={styles.titleText}>Manage Students</Text>
        </View>

        <FlatList 
          data={enrolledStudents} 
          keyExtractor={(item) => item.lrn}
          contentContainerStyle={styles.listContainer}
          renderItem={({item}) => (
            <View style={styles.studentCard}>
              <Image source={{ uri: item.photoUri }} style={styles.studentThumb} />
              <View style={styles.studentInfo}>
                <Text style={styles.studentNameText}>{getFormattedName(item)}</Text>
                <Text style={styles.studentLrnText}>LRN: {item.lrn}</Text>
              </View>
              <TouchableOpacity onPress={() => deleteStudent(item.lrn)}>
                <Text style={styles.deleteIcon}>❌</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No students enrolled yet.</Text>}
        />

        <View style={styles.bottomBarSingle}>
          <TouchableOpacity style={styles.enrollButton} onPress={() => setCurrentScreen('enrollStudent')}>
            <Text style={styles.enrollButtonText}>+ Enroll New Student</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (currentScreen === 'enrollStudent') {
    return (
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.headerArea}>
          <TouchableOpacity onPress={() => setCurrentScreen('manageStudents')} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.titleText}>Enroll Student</Text>
        </View>

        <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.photoPicker} onPress={pickImage}>
            {enrollForm.photoUri ? (
              <Image source={{ uri: enrollForm.photoUri }} style={styles.photoPreview} />
            ) : (
              <Text style={styles.photoPlaceholder}>Tap to add Photo *</Text>
            )}
          </TouchableOpacity>

          <TextInput style={styles.input} placeholder="LRN (Learner Reference Number) *" placeholderTextColor="#64748B" keyboardType="numeric" value={enrollForm.lrn} onChangeText={(t) => setEnrollForm({...enrollForm, lrn: t})} />
          <TextInput style={styles.input} placeholder="First Name *" placeholderTextColor="#64748B" value={enrollForm.firstName} onChangeText={(t) => setEnrollForm({...enrollForm, firstName: t})} />
          <TextInput style={styles.input} placeholder="Last Name *" placeholderTextColor="#64748B" value={enrollForm.lastName} onChangeText={(t) => setEnrollForm({...enrollForm, lastName: t})} />
          <View style={styles.row}>
            <TextInput style={[styles.input, {flex: 1, marginRight: 10}]} placeholder="M.I. (Optional)" placeholderTextColor="#64748B" maxLength={2} value={enrollForm.middleInitial} onChangeText={(t) => setEnrollForm({...enrollForm, middleInitial: t})} />
            <TextInput style={[styles.input, {flex: 1}]} placeholder="Suffix (Optional)" placeholderTextColor="#64748B" value={enrollForm.suffix} onChangeText={(t) => setEnrollForm({...enrollForm, suffix: t})} />
          </View>
          <TextInput style={styles.input} placeholder="Guardian Phone Number" placeholderTextColor="#64748B" keyboardType="phone-pad" value={enrollForm.phone} onChangeText={(t) => setEnrollForm({...enrollForm, phone: t})} />

          <TouchableOpacity style={styles.saveButton} onPress={handleEnrollStudent}>
            <Text style={styles.saveButtonText}>Save Student</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // --- MAIN SCANNER VIEW ---
  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        onBarcodeScanned={scannedStudent ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      >
        <View style={styles.overlay}>
          {scannedStudent ? (
            // Confirmation Modal
            <View style={styles.confirmCard}>
              <Image source={{ uri: scannedStudent.photoUri }} style={styles.confirmPhoto} />
              <View style={styles.confirmDetails}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.confirmName}>{getFormattedName(scannedStudent)}</Text>
                  <Text style={styles.confirmTime}>{scanTime}</Text>
                </View>
                
                <View style={{ width: '100%', alignItems: 'center' }}>
                  <Text style={styles.promptText}>Select Status to Log:</Text>
                  <View style={styles.actionRow}>
                    <TouchableOpacity 
                      style={selectedStatus === 'Present' ? styles.presentBtnActive : styles.presentBtnInactive} 
                      onPress={() => setSelectedStatus('Present')}
                    >
                      <Text style={selectedStatus === 'Present' ? styles.presentBtnActiveText : styles.presentBtnInactiveText}>Present</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={selectedStatus === 'Tardy' ? styles.tardyBtnActive : styles.tardyBtnInactive} 
                      onPress={() => setSelectedStatus('Tardy')}
                    >
                      <Text style={selectedStatus === 'Tardy' ? styles.tardyBtnActiveText : styles.tardyBtnInactiveText}>Tardy</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity style={styles.confirmBtn} onPress={() => confirmAttendance(selectedStatus)}>
                  <Text style={styles.confirmBtnText}>Confirm Attendance</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // The Breathing Target Box
            <Animated.View style={[styles.scanTargetSquare, { transform: [{ scale: pulseAnim }] }]} />
          )}
        </View>
      </CameraView>

      <View style={styles.scannerFooter}>
        <TouchableOpacity style={styles.navButton} onPress={() => setCurrentScreen('manageStudents')}>
          <Text style={styles.navButtonText}>👥 Manage Students</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => setCurrentScreen('history')}>
          <Text style={styles.navButtonText}>📋 View History</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center' },
  scanTargetSquare: { width: 260, height: 260, borderWidth: 4, borderColor: '#14B8A6', borderRadius: 30, backgroundColor: 'rgba(20, 184, 166, 0.1)' },
  
  // Confirmation Modal
  confirmCard: { backgroundColor: '#1E293B', borderRadius: 25, alignItems: 'center', width: '90%', maxWidth: 380, height: 485, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 10, elevation: 10 },
  confirmPhoto: { height: '45%', aspectRatio: 1, alignSelf: 'center', borderRadius: 20, marginTop: 20, resizeMode: 'cover' },
  confirmDetails: { flex: 1, width: '100%', paddingHorizontal: 20, paddingVertical: 15, justifyContent: 'space-between', alignItems: 'center' },
  confirmName: { fontSize: 22, fontWeight: 'bold', color: '#FFF', textAlign: 'center' },
  confirmTime: { fontSize: 16, color: '#94A3B8', marginTop: 4 },
  promptText: { fontSize: 14, color: '#CBD5E1', marginBottom: 8 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  presentBtnActive: { flex: 1, backgroundColor: '#14B8A6', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginRight: 8, borderWidth: 1, borderColor: '#14B8A6' },
  presentBtnActiveText: { color: '#0F172A', fontWeight: 'bold', fontSize: 16 },
  presentBtnInactive: { flex: 1, backgroundColor: 'rgba(20, 184, 166, 0.15)', borderWidth: 1, borderColor: 'rgba(20, 184, 166, 0.3)', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginRight: 8 },
  presentBtnInactiveText: { color: 'rgba(20, 184, 166, 0.6)', fontWeight: 'bold', fontSize: 16 },
  tardyBtnActive: { flex: 1, backgroundColor: '#F59E0B', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginLeft: 8, borderWidth: 1, borderColor: '#F59E0B' },
  tardyBtnActiveText: { color: '#0F172A', fontWeight: 'bold', fontSize: 16 },
  tardyBtnInactive: { flex: 1, backgroundColor: 'rgba(245, 158, 11, 0.15)', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginLeft: 8 },
  tardyBtnInactiveText: { color: 'rgba(245, 158, 11, 0.6)', fontWeight: 'bold', fontSize: 16 },
  confirmBtn: { width: '100%', backgroundColor: '#3B82F6', paddingVertical: 14, borderRadius: 12, alignItems: 'center', shadowColor: '#3B82F6', shadowOpacity: 0.3, shadowRadius: 5, elevation: 3 },
  confirmBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  // Scanner Footer
  scannerFooter: { position: 'absolute', bottom: 30, width: '100%', flexDirection: 'row', justifyContent: 'space-evenly', paddingHorizontal: 10 },
  navButton: { backgroundColor: 'rgba(30, 41, 59, 0.95)', paddingVertical: 15, paddingHorizontal: 15, borderRadius: 20, borderWidth: 1, borderColor: '#334155' },
  navButtonText: { color: '#F8FAFC', fontWeight: 'bold', fontSize: 14 },
  
  // Headers & Lists
  headerArea: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, backgroundColor: '#1E293B' },
  backButton: { marginBottom: 10 },
  backButtonText: { color: '#14B8A6', fontSize: 16, fontWeight: 'bold' },
  titleText: { fontSize: 28, fontWeight: 'bold', color: '#FFF' },
  listContainer: { padding: 15, paddingBottom: 100 },
  
  // History Item
  listItem: { backgroundColor: '#1E293B', padding: 15, borderRadius: 15, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' },
  listName: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  listSubText: { color: '#94A3B8', fontSize: 13, marginTop: 4 },
  listDate: { color: '#14B8A6', fontSize: 14, fontWeight: 'bold' },
  listTime: { color: '#94A3B8', fontSize: 12, marginTop: 4 },
  statusBadge: { marginTop: 6, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, alignSelf: 'flex-start', fontSize: 12, overflow: 'hidden' },
  statusPresent: { backgroundColor: 'rgba(20, 184, 166, 0.2)', color: '#14B8A6' },
  statusTardy: { backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#F59E0B' },

  // Student Card
  studentCard: { backgroundColor: '#1E293B', padding: 15, borderRadius: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  studentThumb: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
  studentInfo: { flex: 1 },
  studentNameText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  studentLrnText: { color: '#94A3B8', fontSize: 13, marginTop: 4 },
  deleteIcon: { fontSize: 20 },

  emptyText: { color: '#64748B', textAlign: 'center', marginTop: 50, fontSize: 16 },
  
  bottomBar: { position: 'absolute', bottom: 0, width: '100%', padding: 20, backgroundColor: '#0F172A', flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#1E293B' },
  exportButton: { flex: 0.7, backgroundColor: '#3B82F6', paddingVertical: 15, borderRadius: 15, alignItems: 'center', marginRight: 10 },
  exportButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  clearButton: { flex: 0.3, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1, borderColor: '#EF4444', paddingVertical: 15, borderRadius: 15, alignItems: 'center' },
  clearButtonText: { color: '#EF4444', fontWeight: 'bold', fontSize: 15 },
  
  bottomBarSingle: { position: 'absolute', bottom: 0, width: '100%', padding: 20, backgroundColor: '#0F172A', borderTopWidth: 1, borderTopColor: '#1E293B' },
  enrollButton: { backgroundColor: '#14B8A6', paddingVertical: 15, borderRadius: 15, alignItems: 'center' },
  enrollButtonText: { color: '#0F172A', fontWeight: 'bold', fontSize: 16 },

  // Enrollment Form
  formContainer: { padding: 20, paddingBottom: 100 },
  photoPicker: { alignSelf: 'center', width: 120, height: 120, borderRadius: 60, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center', marginBottom: 25, borderWidth: 1, borderColor: '#334155', borderStyle: 'dashed' },
  photoPreview: { width: 120, height: 120, borderRadius: 60 },
  photoPlaceholder: { color: '#64748B', textAlign: 'center', padding: 10 },
  input: { backgroundColor: '#1E293B', color: '#FFF', padding: 15, borderRadius: 12, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: '#334155' },
  row: { flexDirection: 'row' },
  saveButton: { backgroundColor: '#3B82F6', paddingVertical: 15, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  primaryButton: { backgroundColor: '#14B8A6', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 25 },
  primaryButtonText: { color: '#0F172A', fontWeight: 'bold', fontSize: 16 }
});