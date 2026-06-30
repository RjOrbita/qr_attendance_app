import { StyleSheet } from 'react-native';

export const globalStyles = StyleSheet.create({
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
  primaryButtonText: { color: '#0F172A', fontWeight: 'bold', fontSize: 16 },

  // ── History: Mode Toggle ──
  modeToggle: { flexDirection: 'row', marginTop: 14, backgroundColor: '#0F172A', borderRadius: 12, padding: 4 },
  modeBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  modeBtnActive: { backgroundColor: '#1E3A5F' },
  modeBtnText: { color: '#64748B', fontWeight: '600', fontSize: 14 },
  modeBtnActiveText: { color: '#14B8A6' },

  // ── History: Date Paginator ──
  datePaginator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#1E293B', borderBottomWidth: 1, borderBottomColor: '#334155' },
  pageArrow: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  pageArrowDisabled: { opacity: 0.3 },
  pageArrowText: { color: '#14B8A6', fontSize: 28, fontWeight: 'bold', lineHeight: 32 },
  dateDisplay: { alignItems: 'center' },
  dateDisplayText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  dateRecordCount: { color: '#14B8A6', fontSize: 13, marginTop: 2 },
  pageIndicator: { textAlign: 'center', color: '#475569', fontSize: 12, paddingVertical: 6 },

  // ── History: Search ──
  searchBarContainer: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#1E293B', borderBottomWidth: 1, borderBottomColor: '#334155' },
  searchBar: { backgroundColor: '#0F172A', color: '#FFF', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, fontSize: 15, borderWidth: 1, borderColor: '#334155' },
  chevron: { color: '#14B8A6', fontSize: 24, fontWeight: 'bold' },

  // ── History: Student Profile Card ──
  studentProfileCard: { backgroundColor: '#1E293B', borderRadius: 20, alignItems: 'center', padding: 24, marginBottom: 20, borderWidth: 1, borderColor: '#334155' },
  studentProfilePhoto: { width: 90, height: 90, borderRadius: 45, marginBottom: 12, borderWidth: 3, borderColor: '#14B8A6' },
  studentProfileName: { color: '#FFF', fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  studentProfileLrn: { color: '#94A3B8', fontSize: 14, marginTop: 4 },
  attendanceSummaryRow: { flexDirection: 'row', marginTop: 16, justifyContent: 'space-around', width: '100%' },
  summaryBadge: { alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#14B8A6', minWidth: 80 },
  summaryBadgeNum: { color: '#14B8A6', fontSize: 22, fontWeight: 'bold' },
  summaryBadgeLabel: { color: '#94A3B8', fontSize: 11, marginTop: 2 },

  // ── History: Section Label ──
  sectionLabel: { color: '#64748B', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },

  // ── History: Weekly Row ──
  weekRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#334155' },
  weekDateBlock: { width: 90 },
  weekDayText: { color: '#94A3B8', fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  weekDateText: { color: '#CBD5E1', fontSize: 13, marginTop: 2 },
  weekRecordBlock: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  weekStatusDot: { fontSize: 18, marginRight: 6 },
  weekStatusText: { fontSize: 14, fontWeight: '600' },
  weekTimeText: { color: '#64748B', fontSize: 12, marginLeft: 8 },

  // ── Student Profile Feature ──
  profileHeaderContainer: { alignItems: 'center', backgroundColor: '#1E293B', paddingVertical: 25, borderBottomWidth: 1, borderBottomColor: '#334155' },
  profileLargeAvatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: '#14B8A6', marginBottom: 15 },
  profileNameLabel: { fontSize: 24, fontWeight: 'bold', color: '#FFF', textAlign: 'center', paddingHorizontal: 20 },
  profileLrnLabel: { fontSize: 16, color: '#94A3B8', marginTop: 4, textAlign: 'center' },
  profileContactLabel: { fontSize: 14, color: '#14B8A6', marginTop: 8, fontWeight: '600', textAlign: 'center' },
  
  tabSwitcherRow: { flexDirection: 'row', backgroundColor: '#0F172A', padding: 10 },
  tabButtonActive: { flex: 1, paddingVertical: 12, borderBottomWidth: 3, borderBottomColor: '#14B8A6', alignItems: 'center' },
  tabButtonInactive: { flex: 1, paddingVertical: 12, borderBottomWidth: 3, borderBottomColor: 'transparent', alignItems: 'center' },
  tabButtonTextActive: { color: '#14B8A6', fontWeight: 'bold', fontSize: 15 },
  tabButtonTextInactive: { color: '#64748B', fontWeight: '600', fontSize: 15 },

  infoSection: { padding: 20, paddingBottom: 100 },
  infoFieldRow: { marginBottom: 20 },
  infoLabel: { fontSize: 13, color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, fontWeight: '700' },
  infoValue: { fontSize: 16, color: '#FFF', backgroundColor: '#1E293B', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  infoInput: { fontSize: 16, color: '#FFF', backgroundColor: '#0F172A', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#14B8A6' },

  fabButton: { position: 'absolute', bottom: 30, right: 25, width: 60, height: 60, borderRadius: 30, backgroundColor: '#14B8A6', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  fabButtonText: { fontSize: 24, color: '#0F172A' },
  fabSaveButton: { position: 'absolute', bottom: 30, right: 25, height: 60, paddingHorizontal: 25, borderRadius: 30, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  fabSaveButtonText: { fontSize: 16, color: '#FFF', fontWeight: 'bold' },
  
  // Custom dropdown styles
  dropdownContainer: { position: 'absolute', top: 60, left: 0, right: 0, backgroundColor: '#1E293B', borderRadius: 12, borderWidth: 1, borderColor: '#14B8A6', zIndex: 9999, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  dropdownOption: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#334155' },
  dropdownOptionText: { color: '#FFF', fontSize: 16 },

  // Custom dropdown selector styles (future-proof months)
  dropdownSelectorContainer: { marginHorizontal: 20, marginTop: 15, position: 'relative' },
  dropdownSelectorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E293B', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  dropdownSelectorHeaderLabel: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
  dropdownSelectorHeaderText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  dropdownSelectorList: { position: 'absolute', top: 52, left: 0, right: 0, backgroundColor: '#1E293B', borderRadius: 12, borderWidth: 1, borderColor: '#14B8A6', zIndex: 9999, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5, overflow: 'hidden' },
  dropdownSelectorItem: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#334155' },
  dropdownSelectorItemText: { color: '#FFF', fontSize: 14 },

  // Sleek summary bar styles
  sleekSummaryBar: { flexDirection: 'row', backgroundColor: '#1E293B', borderRadius: 16, paddingVertical: 10, marginHorizontal: 20, marginVertical: 12, alignItems: 'center', justifyContent: 'space-around', borderWidth: 1, borderColor: '#334155' },
  sleekSummaryCol: { flexDirection: 'row', alignItems: 'center' },
  sleekSummaryVal: { color: '#14B8A6', fontSize: 16, fontWeight: 'bold', marginRight: 6 },
  sleekSummaryLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
  sleekSummaryDivider: { width: 1, height: 18, backgroundColor: '#334155' }
});
