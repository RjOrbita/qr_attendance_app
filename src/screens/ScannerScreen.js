import React, { useState, useEffect, useRef, useContext } from 'react';
import { Text, View, TouchableOpacity, Animated, Image, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { globalStyles as styles } from '../theme/styles';
import { getFormattedName, getTodayDate, getInitials } from '../utils/helpers';
import { AppContext } from '../context/AppContext';

export default function ScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const { masterLog, setMasterLog, enrolledStudents } = useContext(AppContext);
  
  const [scannedStudent, setScannedStudent] = useState(null);
  const [scanTime, setScanTime] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('Present');
  const [isScanningActive, setIsScanningActive] = useState(true);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
      ])
    ).start();
  }, [pulseAnim]);

  const handleBarCodeScanned = ({ data }) => {
    const scannedLrn = data.trim();
    
    // Silent fail if LRN not found in enrolled students
    const student = enrolledStudents.find(s => s.lrn === scannedLrn);
    if (!student) return;

    // Pause scanning immediately to prevent duplicate triggers
    setIsScanningActive(false);

    // Check if already logged today
    const isAlreadyCheckedInToday = masterLog.some(
      log => log.id === student.lrn && log.date === getTodayDate()
    );
    
    if (isAlreadyCheckedInToday) {
      Alert.alert(
        "Already Checked In", 
        `${getFormattedName(student)} is already logged for today.`,
        [{ text: "OK", onPress: () => setIsScanningActive(true) }]
      );
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
    await setMasterLog(updatedMaster);
    
    setScannedStudent(null);
    setScanTime(null);
    setIsScanningActive(true); // Resume scanning
  };

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

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        onBarcodeScanned={(!isScanningActive || scannedStudent) ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      >
        <View style={styles.overlay}>
          {scannedStudent ? (
            // Confirmation Modal
            <View style={styles.confirmCard}>
              {scannedStudent.photoUri ? (
                <Image source={{ uri: scannedStudent.photoUri }} style={styles.confirmPhoto} />
              ) : (
                <View style={[styles.confirmPhoto, { backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center', marginTop: 20 }]}>
                  <Text style={{ color: '#14B8A6', fontSize: 48, fontWeight: 'bold' }}>
                    {getInitials(scannedStudent)}
                  </Text>
                </View>
              )}
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
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('ManageStudents')}>
          <Text style={styles.navButtonText}>👥 Manage Students</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('History')}>
          <Text style={styles.navButtonText}>📋 View History</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
