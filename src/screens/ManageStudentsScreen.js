import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, Alert, TextInput } from 'react-native';
import { globalStyles as styles } from '../theme/styles';
import { getFormattedName } from '../utils/helpers';
import { AppContext } from '../context/AppContext';

export default function ManageStudentsScreen({ navigation }) {
  const { enrolledStudents, setEnrolledStudents } = useContext(AppContext);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStudents = enrolledStudents.filter(student => {
    const query = searchQuery.toLowerCase();
    const fullName = getFormattedName(student).toLowerCase();
    const lrn = String(student.lrn).toLowerCase();
    return fullName.includes(query) || lrn.includes(query);
  });

  const deleteStudent = (lrn) => {
    Alert.alert("Remove Student", "Are you sure you want to remove this student?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => {
          const updated = enrolledStudents.filter(s => s.lrn !== lrn);
          await setEnrolledStudents(updated);
      }}
    ]);
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
        contentContainerStyle={styles.listContainer}
        renderItem={({item}) => (
          <TouchableOpacity 
            style={styles.studentCard}
            onPress={() => navigation.navigate('StudentProfile', { lrn: item.lrn })}
          >
            <Image source={{ uri: item.photoUri }} style={styles.studentThumb} />
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

      <View style={styles.bottomBarSingle}>
        <TouchableOpacity style={styles.enrollButton} onPress={() => navigation.navigate('EnrollStudent')}>
          <Text style={styles.enrollButtonText}>+ Enroll New Student</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
