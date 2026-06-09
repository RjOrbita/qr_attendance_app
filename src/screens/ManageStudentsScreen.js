import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, Alert, TextInput, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { globalStyles as styles } from '../theme/styles';
import { getFormattedName, getInitials, parseCSV } from '../utils/helpers';
import { AppContext } from '../context/AppContext';

export default function ManageStudentsScreen({ navigation }) {
  const { enrolledStudents, setEnrolledStudents } = useContext(AppContext);
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStudents = enrolledStudents
    .filter(student => {
      const query = searchQuery.toLowerCase();
      const fullName = getFormattedName(student).toLowerCase();
      const lrn = String(student.lrn).toLowerCase();
      return fullName.includes(query) || lrn.includes(query);
    })
    .sort((a, b) => (a.lastName || '').localeCompare(b.lastName || ''));

  const deleteStudent = (lrn) => {
    Alert.alert("Remove Student", "Are you sure you want to remove this student?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => {
          const studentToDelete = enrolledStudents.find(s => s.lrn === lrn);
          if (studentToDelete && studentToDelete.photoUri) {
            try {
              const fileInfo = await FileSystem.getInfoAsync(studentToDelete.photoUri);
              if (fileInfo.exists) {
                await FileSystem.deleteAsync(studentToDelete.photoUri, { idempotent: true });
              }
            } catch (err) {
              console.error("Failed to delete student photo file:", err);
            }
          }
          const updated = enrolledStudents.filter(s => s.lrn !== lrn);
          await setEnrolledStudents(updated);
      }}
    ]);
  };

  const importStudentsFromCSV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/comma-separated-values', 'text/csv'],
        copyToCacheDirectory: true
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const fileUri = result.assets[0].uri;
      const fileContent = await FileSystem.readAsStringAsync(fileUri);
      
      const parsed = parseCSV(fileContent);
      if (parsed.length <= 1) {
        Alert.alert("Empty CSV", "The CSV file appears to be empty or has no data.");
        return;
      }

      const rawHeaders = parsed[0];
      const dataRows = parsed.slice(1);

      // Normalize headers and create index mapping
      const headerMap = {
        lrn: 'lrn',
        learnerreferencenumber: 'lrn',
        firstname: 'firstName',
        lastname: 'lastName',
        middleinitial: 'middleInitial',
        mi: 'middleInitial',
        suffix: 'suffix',
        phone: 'phone',
        phonenumber: 'phone',
        guardianphone: 'phone',
        sex: 'sex',
        gender: 'sex',
        birthdate: 'birthdate',
        birthday: 'birthdate',
        address: 'address',
        fathername: 'fatherName',
        fathersname: 'fatherName',
        mothername: 'motherMaidenName',
        mothersname: 'motherMaidenName',
        mothermaidenname: 'motherMaidenName',
      };

      const columnMapping = {};
      rawHeaders.forEach((h, index) => {
        const normalized = h.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
        if (headerMap[normalized]) {
          columnMapping[headerMap[normalized]] = index;
        }
      });

      // Check for required fields mapping
      if (columnMapping.lrn === undefined || columnMapping.firstName === undefined || columnMapping.lastName === undefined) {
        Alert.alert(
          "Invalid CSV Format",
          "CSV must include columns for LRN, First Name, and Last Name. Column headers are not case-sensitive."
        );
        return;
      }

      const newStudentsList = [...enrolledStudents];
      let importedCount = 0;
      let duplicateCount = 0;
      let invalidCount = 0;
      let errorMsgs = [];

      dataRows.forEach((row, rowIndex) => {
        // Skip completely empty rows
        if (row.length === 0 || (row.length === 1 && row[0].trim() === '')) {
          return;
        }

        const getVal = (key) => {
          const colIndex = columnMapping[key];
          return colIndex !== undefined && row[colIndex] ? row[colIndex].trim() : '';
        };

        const lrn = getVal('lrn').replace(/[^0-9]/g, '');
        const firstName = getVal('firstName');
        const lastName = getVal('lastName');
        const middleInitial = getVal('middleInitial').substring(0, 2);
        const suffix = getVal('suffix');
        const phone = getVal('phone');
        
        let sex = getVal('sex');
        if (sex) {
          const lowerSex = sex.toLowerCase();
          if (lowerSex.startsWith('m')) sex = 'Male';
          else if (lowerSex.startsWith('f')) sex = 'Female';
          else sex = '';
        }
        
        let birthdate = getVal('birthdate');
        if (birthdate) {
          const cleanBday = birthdate.replace(/[^0-9]/g, '');
          if (cleanBday.length === 8) {
            birthdate = `${cleanBday.substring(0, 2)}/${cleanBday.substring(2, 4)}/${cleanBday.substring(4, 8)}`;
          }
        }

        const address = getVal('address');
        const fatherName = getVal('fatherName');
        const motherMaidenName = getVal('motherMaidenName');

        const rowNum = rowIndex + 2; // +1 for 0-index, +1 for header

        if (!lrn || !firstName || !lastName) {
          invalidCount++;
          errorMsgs.push(`Row ${rowNum}: Missing LRN, First Name, or Last Name.`);
          return;
        }

        if (!/^\d{12}$/.test(lrn)) {
          invalidCount++;
          errorMsgs.push(`Row ${rowNum}: LRN must be exactly 12 digits (Found "${lrn}").`);
          return;
        }

        const isDuplicate = newStudentsList.some(s => s.lrn === lrn);
        if (isDuplicate) {
          duplicateCount++;
          return;
        }

        newStudentsList.push({
          lrn,
          firstName,
          lastName,
          middleInitial,
          suffix,
          phone,
          sex,
          birthdate,
          address,
          fatherName,
          motherMaidenName,
          photoUri: null
        });
        importedCount++;
      });

      if (importedCount > 0) {
        await setEnrolledStudents(newStudentsList);
      }

      let reportMsg = `Successfully imported ${importedCount} student(s).`;
      if (duplicateCount > 0) {
        reportMsg += `\n- Skipped ${duplicateCount} duplicate LRN(s).`;
      }
      if (invalidCount > 0) {
        reportMsg += `\n- Failed to import ${invalidCount} invalid row(s).`;
      }

      if (errorMsgs.length > 0) {
        const displayedErrors = errorMsgs.slice(0, 5).join('\n');
        const errorTail = errorMsgs.length > 5 ? `\n...and ${errorMsgs.length - 5} more errors.` : '';
        Alert.alert(
          "Import Results",
          `${reportMsg}\n\nErrors:\n${displayedErrors}${errorTail}`
        );
      } else {
        Alert.alert("Import Complete", reportMsg);
      }
    } catch (err) {
      Alert.alert("Import Error", "Failed to parse or import CSV file.");
      console.error(err);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerArea}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>&lt; Back to Scanner</Text>
        </TouchableOpacity>
        <Text style={styles.titleText}>Manage Students</Text>
        <TextInput
          style={[styles.searchBar, { marginTop: 16 }]}
          placeholder="🔍  Search by name or LRN..."
          placeholderTextColor="#64748B"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
          autoCorrect={false}
        />
      </View>

      <FlatList 
        data={filteredStudents} 
        keyExtractor={(item) => item.lrn}
        contentContainerStyle={[styles.listContainer, { paddingBottom: 100 + insets.bottom }]}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        renderItem={({item}) => (
          <TouchableOpacity 
            style={styles.studentCard}
            onPress={() => navigation.navigate('StudentProfile', { lrn: item.lrn })}
          >
            {item.photoUri ? (
              <Image source={{ uri: item.photoUri }} style={styles.studentThumb} />
            ) : (
              <View style={[styles.studentThumb, { backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#14B8A6', fontSize: 18, fontWeight: 'bold' }}>
                  {getInitials(item)}
                </Text>
              </View>
            )}
            <View style={styles.studentInfo}>
              <Text style={styles.studentNameText}>{getFormattedName(item)}</Text>
              <Text style={styles.studentLrnText}>LRN: {item.lrn}</Text>
            </View>
            <TouchableOpacity onPress={() => deleteStudent(item.lrn)}>
              <Text style={styles.deleteIcon}>❌</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {searchQuery ? "No matching students found." : "No students enrolled yet."}
          </Text>
        }
      />

      <View style={[styles.bottomBar, { flexDirection: 'row', paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity 
          style={[styles.enrollButton, { flex: 0.55, marginRight: 10 }]} 
          onPress={() => navigation.navigate('EnrollStudent')}
        >
          <Text style={styles.enrollButtonText}>+ Enroll Student</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.clearButton, { flex: 0.45, borderColor: '#14B8A6', backgroundColor: 'rgba(20, 184, 166, 0.1)' }]} 
          onPress={importStudentsFromCSV}
        >
          <Text style={[styles.clearButtonText, { color: '#14B8A6' }]}>📥 Import CSV</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
