import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, TextInput, Image, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { globalStyles as styles } from '../theme/styles';
import { AppContext } from '../context/AppContext';

export default function EnrollStudentScreen({ navigation }) {
  const { enrolledStudents, setEnrolledStudents } = useContext(AppContext);
  const [enrollForm, setEnrollForm] = useState({
    lrn: '', lastName: '', firstName: '', middleInitial: '', suffix: '', phone: '', photoUri: null
  });

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });

    if (!result.canceled) {
      setEnrollForm({ ...enrollForm, photoUri: result.assets[0].uri });
    }
  };

  const handleEnrollStudent = async () => {
    const cleanedLrn = enrollForm.lrn.trim();
    if (!cleanedLrn || !enrollForm.lastName || !enrollForm.firstName) {
      Alert.alert("Missing Fields", "LRN, Last Name, and First Name are required.");
      return;
    }

    if (!/^\d{12}$/.test(cleanedLrn)) {
      Alert.alert("Invalid LRN", "LRN (Learner Reference Number) must be exactly 12 digits.");
      return;
    }

    if (enrolledStudents.some(s => s.lrn === cleanedLrn)) {
      Alert.alert("Duplicate LRN", "A student with this LRN is already enrolled.");
      return;
    }

    try {
      let persistentPhotoUri = null;
      if (enrollForm.photoUri) {
        // Persist image
        const filename = enrollForm.photoUri.split('/').pop();
        persistentPhotoUri = `${FileSystem.documentDirectory}${filename}`;
        await FileSystem.copyAsync({
          from: enrollForm.photoUri,
          to: persistentPhotoUri
        });
      }

      const newStudent = { ...enrollForm, lrn: cleanedLrn, photoUri: persistentPhotoUri };
      const updatedStudents = [...enrolledStudents, newStudent];
      await setEnrolledStudents(updatedStudents);
      
      Alert.alert("Success", "Student enrolled successfully!");
      setEnrollForm({ lrn: '', lastName: '', firstName: '', middleInitial: '', suffix: '', phone: '', photoUri: null });
      navigation.goBack(); // Go back to manage students
    } catch (err) {
      Alert.alert("Error", "Failed to save student data.");
      console.error(err);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.headerArea}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>&lt; Back</Text>
        </TouchableOpacity>
        <Text style={styles.titleText}>Enroll Student</Text>
      </View>

      <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.photoPicker} onPress={pickImage}>
          {enrollForm.photoUri ? (
            <Image source={{ uri: enrollForm.photoUri }} style={styles.photoPreview} />
          ) : (
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 40, color: '#14B8A6' }}>👤</Text>
              <Text style={[styles.photoPlaceholder, { marginTop: 4, fontSize: 12 }]}>Add Photo (Optional)</Text>
            </View>
          )}
        </TouchableOpacity>

        <TextInput 
          style={styles.input} 
          placeholder="LRN (Learner Reference Number) *" 
          placeholderTextColor="#64748B" 
          keyboardType="numeric" 
          maxLength={12}
          value={enrollForm.lrn} 
          onChangeText={(t) => setEnrollForm({...enrollForm, lrn: t.replace(/[^0-9]/g, '')})} 
        />
        <TextInput style={styles.input} placeholder="First Name *" placeholderTextColor="#64748B" value={enrollForm.firstName} onChangeText={(t) => setEnrollForm({...enrollForm, firstName: t})} />
        <TextInput style={styles.input} placeholder="Last Name *" placeholderTextColor="#64748B" value={enrollForm.lastName} onChangeText={(t) => setEnrollForm({...enrollForm, lastName: t})} />
        <View style={styles.row}>
          <TextInput style={[styles.input, {flex: 1, marginRight: 10}]} placeholder="M.I. (Optional)" placeholderTextColor="#64748B" maxLength={2} value={enrollForm.middleInitial} onChangeText={(t) => setEnrollForm({...enrollForm, middleInitial: t})} />
          <TextInput style={[styles.input, {flex: 1}]} placeholder="Suffix (Optional)" placeholderTextColor="#64748B" value={enrollForm.suffix} onChangeText={(t) => setEnrollForm({...enrollForm, suffix: t})} />
        </View>
        <TextInput style={styles.input} placeholder="Guardian Phone Number (Optional)" placeholderTextColor="#64748B" keyboardType="phone-pad" value={enrollForm.phone} onChangeText={(t) => setEnrollForm({...enrollForm, phone: t})} />

        <TouchableOpacity style={styles.saveButton} onPress={handleEnrollStudent}>
          <Text style={styles.saveButtonText}>Save Student</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
