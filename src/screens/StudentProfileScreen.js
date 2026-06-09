import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, ScrollView, FlatList, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { globalStyles as styles } from '../theme/styles';
import { AppContext } from '../context/AppContext';
import { getFormattedName, getInitials } from '../utils/helpers';

const formatMonthYear = (monthStr) => {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthIndex = parseInt(month, 10) - 1;
  return `${monthNames[monthIndex]} ${year}`;
};

const formatHistoryDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const dayName = weekdays[d.getDay()];
  const monthName = months[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  
  return `${dayName}, ${monthName} ${day}, ${year}`;
};

export default function StudentProfileScreen({ route, navigation }) {
  const { lrn, initialTab } = route.params;
  const { enrolledStudents, updateStudentProfile, masterLog, nonSchoolDays } = useContext(AppContext);
  
  const [student, setStudent] = useState(null);
  const [activeTab, setActiveTab] = useState(initialTab || 'Information');
  const [isEditing, setIsEditing] = useState(false);
  const [sexDropdownOpen, setSexDropdownOpen] = useState(false);
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');

  // Form State
  const [form, setForm] = useState({
    sex: '',
    birthdate: '',
    address: '',
    fatherName: '',
    motherMaidenName: '',
    phone: '',
    photoUri: null
  });

  useEffect(() => {
    const found = enrolledStudents.find(s => s.lrn === lrn);
    if (found) {
      setStudent(found);
      setForm({
        sex: found.sex || '',
        birthdate: found.birthdate || '',
        address: found.address || '',
        fatherName: found.fatherName || '',
        motherMaidenName: found.motherMaidenName || '',
        phone: found.phone || '',
        photoUri: found.photoUri || null
      });

      // Also get history to initialize month selector
      const history = masterLog.filter(log => log.id === found.lrn);
      const months = [...new Set(history.map(log => log.date.substring(0, 7)))].sort((a, b) => b.localeCompare(a));
      if (months.length > 0 && !months.includes(selectedMonth)) {
        setSelectedMonth(months[0]);
      }
    }
  }, [enrolledStudents, lrn, masterLog]);

  const pickImage = async () => {
    if (!isEditing) return;
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });

    if (!result.canceled) {
      setForm({ ...form, photoUri: result.assets[0].uri });
    }
  };

  const handleBirthdateChange = (text) => {
    const clean = text.replace(/[^0-9]/g, '');
    let formatted = '';
    
    if (clean.length > 0) {
      formatted = clean.substring(0, 2);
      if (clean.length > 2) {
        formatted += '/' + clean.substring(2, 4);
        if (clean.length > 4) {
          formatted += '/' + clean.substring(4, 8);
        }
      }
    }
    
    setForm({ ...form, birthdate: formatted });
  };

  const validateBirthdate = (dateStr) => {
    if (!dateStr) return true;
    
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!regex.test(dateStr)) return false;
    
    const [monthStr, dayStr, yearStr] = dateStr.split('/');
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);
    const year = parseInt(yearStr, 10);
    
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    
    if (month === 2) {
      const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
      if (isLeap) {
        if (day > 29) return false;
      } else {
        if (day > 28) return false;
      }
    } else {
      if (day > daysInMonth[month - 1]) return false;
    }
    
    const currentYear = new Date().getFullYear();
    if (year < 1900 || year > currentYear) return false;
    
    return true;
  };

  const handleSave = async () => {
    if (form.birthdate && !validateBirthdate(form.birthdate)) {
      Alert.alert(
        "Invalid Birthdate",
        "Please enter a valid birthdate in MM/DD/YYYY format."
      );
      return;
    }

    try {
      let finalPhotoUri = form.photoUri;

      // If photo changed
      if (form.photoUri !== student.photoUri) {
        if (form.photoUri) {
          const filename = form.photoUri.split('/').pop();
          const persistentPhotoUri = `${FileSystem.documentDirectory}${filename}`;
          await FileSystem.copyAsync({
            from: form.photoUri,
            to: persistentPhotoUri
          });
          finalPhotoUri = persistentPhotoUri;
        }

        // Clean up previous photo file if it exists
        if (student.photoUri) {
          try {
            const fileInfo = await FileSystem.getInfoAsync(student.photoUri);
            if (fileInfo.exists) {
              await FileSystem.deleteAsync(student.photoUri, { idempotent: true });
            }
          } catch (err) {
            console.error("Failed to delete old photo file:", err);
          }
        }
      }

      await updateStudentProfile(lrn, { ...form, photoUri: finalPhotoUri });
      setIsEditing(false);
    } catch (err) {
      Alert.alert("Error", "Failed to save student profile photo.");
      console.error(err);
    }
  };

  if (!student) return null;

  const studentHistory = masterLog.filter(log => log.id === student.lrn);

  const renderSexField = () => {
    return (
      <View style={[styles.infoFieldRow, { zIndex: 1000 }]}>
        <Text style={styles.infoLabel}>Sex</Text>
        {isEditing ? (
          <View style={{ position: 'relative' }}>
            <TouchableOpacity 
              style={[styles.infoInput, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
              onPress={() => setSexDropdownOpen(!sexDropdownOpen)}
            >
              <Text style={{ color: form.sex ? '#FFF' : '#64748B', fontSize: 16 }}>
                {form.sex || 'Select Sex'}
              </Text>
              <Text style={{ color: '#14B8A6', fontSize: 16 }}>{sexDropdownOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            
            {sexDropdownOpen && (
              <View style={styles.dropdownContainer}>
                <TouchableOpacity 
                  style={styles.dropdownOption} 
                  onPress={() => {
                    setForm({ ...form, sex: 'Male' });
                    setSexDropdownOpen(false);
                  }}
                >
                  <Text style={styles.dropdownOptionText}>Male</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.dropdownOption, { borderBottomWidth: 0 }]} 
                  onPress={() => {
                    setForm({ ...form, sex: 'Female' });
                    setSexDropdownOpen(false);
                  }}
                >
                  <Text style={styles.dropdownOptionText}>Female</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <Text style={styles.infoValue}>{form.sex || 'Not set'}</Text>
        )}
      </View>
    );
  };

  const renderBirthdateField = () => {
    return (
      <View style={styles.infoFieldRow}>
        <Text style={styles.infoLabel}>Birthdate</Text>
        {isEditing ? (
          <TextInput
            style={styles.infoInput}
            value={form.birthdate}
            onChangeText={handleBirthdateChange}
            keyboardType="numeric"
            placeholder="MM/DD/YYYY"
            placeholderTextColor="#64748B"
            maxLength={10}
          />
        ) : (
          <Text style={styles.infoValue}>{form.birthdate || 'Not set'}</Text>
        )}
      </View>
    );
  };

  const renderMonthSelector = () => {
    const studentHistory = masterLog.filter(log => log.id === student.lrn);
    const months = [...new Set(studentHistory.map(log => log.date.substring(0, 7)))].sort((a, b) => b.localeCompare(a));
    
    if (months.length === 0) return null;
    
    return (
      <View style={[styles.dropdownSelectorContainer, { zIndex: 2000 }]}>
        <TouchableOpacity
          style={styles.dropdownSelectorHeader}
          onPress={() => setMonthDropdownOpen(!monthDropdownOpen)}
        >
          <Text style={styles.dropdownSelectorHeaderLabel}>📅  View Month:</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.dropdownSelectorHeaderText}>
              {formatMonthYear(selectedMonth)}
            </Text>
            <Text style={{ color: '#14B8A6', marginLeft: 8, fontSize: 12 }}>
              {monthDropdownOpen ? '▲' : '▼'}
            </Text>
          </View>
        </TouchableOpacity>
        
        {monthDropdownOpen && (
          <View style={styles.dropdownSelectorList}>
            <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
              {months.map(m => (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.dropdownSelectorItem,
                    selectedMonth === m && { backgroundColor: 'rgba(20, 184, 166, 0.15)' }
                  ]}
                  onPress={() => {
                    setSelectedMonth(m);
                    setMonthDropdownOpen(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownSelectorItemText,
                    selectedMonth === m && { color: '#14B8A6', fontWeight: 'bold' }
                  ]}>
                    {formatMonthYear(m)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  const renderAttendanceSummary = () => {
    if (!selectedMonth) return null;
    
    const studentHistory = masterLog.filter(log => log.id === student.lrn);
    const studentScansInMonth = studentHistory.filter(log => log.date.startsWith(selectedMonth));
    
    const presentCount = studentScansInMonth.filter(log => (log.status || 'Present') === 'Present').length;
    const tardyCount = studentScansInMonth.filter(log => log.status === 'Tardy').length;
    
    // School days in this month (any date in masterLog for this month, excluding holidays/suspensions)
    const schoolDaysInMonth = [...new Set(masterLog
      .filter(log => log.date.startsWith(selectedMonth))
      .map(log => log.date)
    )].filter(dateStr => {
      const nsdEntry = nonSchoolDays?.find(n => n.date === dateStr);
      if (nsdEntry && (nsdEntry.reason === 'Holiday' || nsdEntry.reason === 'Class Suspended')) {
        return false;
      }
      return true;
    });
    
    const studentScannedDates = new Set(studentScansInMonth.map(log => log.date));
    const absentCount = schoolDaysInMonth.filter(date => !studentScannedDates.has(date)).length;

    return (
      <View style={styles.sleekSummaryBar}>
        <View style={styles.sleekSummaryCol}>
          <Text style={styles.sleekSummaryVal}>{presentCount}</Text>
          <Text style={styles.sleekSummaryLabel}>Present</Text>
        </View>
        <View style={styles.sleekSummaryDivider} />
        <View style={styles.sleekSummaryCol}>
          <Text style={[styles.sleekSummaryVal, { color: '#F59E0B' }]}>{tardyCount}</Text>
          <Text style={styles.sleekSummaryLabel}>Tardy</Text>
        </View>
        <View style={styles.sleekSummaryDivider} />
        <View style={styles.sleekSummaryCol}>
          <Text style={[styles.sleekSummaryVal, { color: '#EF4444' }]}>{absentCount}</Text>
          <Text style={styles.sleekSummaryLabel}>Absent</Text>
        </View>
      </View>
    );
  };

  const renderInfoField = (label, valueKey, keyboardType = 'default') => (
    <View style={styles.infoFieldRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      {isEditing ? (
        <TextInput
          style={styles.infoInput}
          value={form[valueKey]}
          onChangeText={(text) => setForm({ ...form, [valueKey]: text })}
          keyboardType={keyboardType}
          placeholder={`Enter ${label}`}
          placeholderTextColor="#64748B"
        />
      ) : (
        <Text style={styles.infoValue}>{form[valueKey] || 'Not set'}</Text>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={[styles.headerArea, { paddingBottom: 0 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>&lt; Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.profileHeaderContainer}>
        <TouchableOpacity 
          onPress={pickImage} 
          disabled={!isEditing} 
          style={{ position: 'relative', alignItems: 'center' }}
        >
          {isEditing ? (
            form.photoUri ? (
              <Image source={{ uri: form.photoUri }} style={styles.profileLargeAvatar} />
            ) : (
              <View style={[styles.profileLargeAvatar, { backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#14B8A6', fontSize: 36, fontWeight: 'bold' }}>
                  {getInitials(student)}
                </Text>
              </View>
            )
          ) : (
            student.photoUri ? (
              <Image source={{ uri: student.photoUri }} style={styles.profileLargeAvatar} />
            ) : (
              <View style={[styles.profileLargeAvatar, { backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#14B8A6', fontSize: 36, fontWeight: 'bold' }}>
                  {getInitials(student)}
                </Text>
              </View>
            )
          )}
          
          {isEditing && (
            <View style={{
              position: 'absolute',
              bottom: 15,
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#334155'
            }}>
              <Text style={{ color: '#14B8A6', fontSize: 11, fontWeight: 'bold' }}>📷 CHANGE</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.profileNameLabel}>{getFormattedName(student)}</Text>
        <Text style={styles.profileLrnLabel}>LRN: {student.lrn}</Text>
        <Text style={styles.profileContactLabel}>Emergency: {student.phone}</Text>
      </View>

      <View style={styles.tabSwitcherRow}>
        <TouchableOpacity 
          style={activeTab === 'Information' ? styles.tabButtonActive : styles.tabButtonInactive}
          onPress={() => setActiveTab('Information')}
        >
          <Text style={activeTab === 'Information' ? styles.tabButtonTextActive : styles.tabButtonTextInactive}>About</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={activeTab === 'History' ? styles.tabButtonActive : styles.tabButtonInactive}
          onPress={() => setActiveTab('History')}
        >
          <Text style={activeTab === 'History' ? styles.tabButtonTextActive : styles.tabButtonTextInactive}>History</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'Information' ? (
        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.infoSection} keyboardShouldPersistTaps="handled">
            {renderSexField()}
            {renderBirthdateField()}
            {renderInfoField('Address', 'address')}
            {renderInfoField('Father\'s Name', 'fatherName')}
            {renderInfoField('Mother\'s Maiden Name', 'motherMaidenName')}
            {renderInfoField('Emergency Contact', 'phone', 'phone-pad')}
          </ScrollView>
          
          {isEditing ? (
            <TouchableOpacity style={styles.fabSaveButton} onPress={handleSave}>
              <Text style={styles.fabSaveButtonText}>Save Profile</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.fabButton} onPress={() => setIsEditing(true)}>
              <Text style={styles.fabButtonText}>✎</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {renderMonthSelector()}
          {renderAttendanceSummary()}
          <FlatList
            data={
              selectedMonth
                ? [...masterLog.filter(log => log.id === student.lrn && log.date.startsWith(selectedMonth))].reverse()
                : []
            }
            keyExtractor={(item) => item.key}
            contentContainerStyle={[styles.infoSection, { paddingTop: 15 }]}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={Platform.OS === 'android'}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {selectedMonth ? "No attendance records for this month." : "No attendance records found."}
              </Text>
            }
            renderItem={({ item }) => (
              <View style={styles.listItem}>
                <View>
                  <Text style={styles.listDate}>{formatHistoryDate(item.date)}</Text>
                  <Text style={styles.listTime}>{item.time}</Text>
                </View>
                <Text style={[styles.statusBadge, item.status === 'Present' ? styles.statusPresent : styles.statusTardy]}>
                  {item.status}
                </Text>
              </View>
            )}
          />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
