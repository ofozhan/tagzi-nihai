import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import {
  SafeAreaView, View, Text, StyleSheet, ScrollView,
  ActivityIndicator, Alert, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../utils';

const KayitItem_detail = ({ item, tip, onEdit }) => (
    <View style={styles.kayitItem_detail}>
        <View style={{ flex: 1 }}>
            <Text style={[styles.kayitTutar_detail, { color: tip === 'kazanc' ? '#27ae60' : '#e74c3c' }]}>
                {tip === 'kazanc' ? '+ ' : '- '}{formatCurrency(item.tutar)}
            </Text>
            {item.not ? <Text style={styles.notText_detail}>{item.not}</Text> : null}
        </View>
        <TouchableOpacity onPress={onEdit} style={styles.editButton_detail}>
            <Ionicons name="pencil-outline" size={20} color="#555" />
        </TouchableOpacity>
    </View>
);
const OzetSatiri_detail = ({ label, deger, renk }) => (<View style={styles.ozetSatiri_detail}><Text style={styles.ozetLabel_detail}>{label}</Text><Text style={[styles.ozetDeger_detail, { color: renk || '#000' }]}>{deger}</Text></View>);

export default function DayDetailScreen({ route, navigation }) {
  const { date } = route.params; 
  const [dayData, setDayData] = useState(null); 
  const [isLoading, setIsLoading] = useState(true); 
  const [isModalVisible, setIsModalVisible] = useState(false); 
  const [editingItem, setEditingItem] = useState(null); 
  const [editTutar, setEditTutar] = useState(''); 
  const [editNot, setEditNot] = useState('');
  
  const handleDeleteDay = useCallback(() => { Alert.alert("Kaydı Sil", `${new Date(date).toLocaleDateString('tr-TR')} tarihli kaydı kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`, [{ text: "İptal", style: "cancel" }, { text: "Evet, Sil", onPress: async () => { try { const storageKey = `@TagziApp:data_${date}`; await AsyncStorage.removeItem(storageKey); navigation.goBack(); } catch (e) { console.error("Failed to delete data", e); Alert.alert("Hata", "Kayıt silinirken bir sorun oluştu."); } }, style: "destructive", }]); }, [navigation, date]); 
  
  useLayoutEffect(() => { navigation.setOptions({ headerRight: () => (<TouchableOpacity onPress={handleDeleteDay} style={{ marginRight: 15 }}><Ionicons name="trash-outline" size={24} color="#e74c3c" /></TouchableOpacity>), }); }, [navigation, handleDeleteDay]);
  
  const loadDayData = useCallback(async () => { setIsLoading(true); const storageKey = `@TagziApp:data_${date}`; try { const dataString = await AsyncStorage.getItem(storageKey); if (dataString) { const parsedData = JSON.parse(dataString); const toplamKazanc = (parsedData.kazanclar || []).reduce((sum, item) => sum + item.tutar, 0); const baslangic = parseFloat(parsedData.startKm) || 0; const bitis = parseFloat(parsedData.endKm) || 0; const maliyetPerKm = parseFloat(parsedData.yakitMaliyeti) || 0; const toplamKm = bitis > baslangic ? bitis - baslangic : 0; const yakitMasrafi = toplamKm * maliyetPerKm; const toplamEkstraMasraf = (parsedData.ekstraMasraflar || []).reduce((sum, item) => sum + item.tutar, 0); const toplamMasraf = yakitMasrafi + toplamEkstraMasraf; const netKar = toplamKazanc - toplamMasraf; setDayData({ ...parsedData, toplamKazanc, toplamMasraf, toplamKm, netKar }); } } catch (e) { console.error("Failed to load day data", e); } finally { setIsLoading(false); } }, [date]);
  
  useEffect(() => { loadDayData(); }, [loadDayData]);

  const openEditModal = useCallback((item, tip) => { setEditingItem({ ...item, tip }); setEditTutar(item.tutar.toString()); setEditNot(item.not || ''); setIsModalVisible(true); }, []);
  const handleSaveChanges = useCallback(async () => { if (!editingItem || !editTutar) { Alert.alert("Hata", "Tutar boş bırakılamaz."); return; } const updatedDayData = JSON.parse(JSON.stringify(dayData)); const listToUpdate = editingItem.tip === 'kazanc' ? updatedDayData.kazanclar : updatedDayData.ekstraMasraflar; const itemIndex = listToUpdate.findIndex(item => item.id === editingItem.id); if (itemIndex > -1) { listToUpdate[itemIndex].tutar = parseFloat(editTutar.replace(',', '.')) || 0; listToUpdate[itemIndex].not = editNot; } try { const storageKey = `@TagziApp:data_${date}`; await AsyncStorage.setItem(storageKey, JSON.stringify(updatedDayData)); await loadDayData(); setIsModalVisible(false); setEditingItem(null); } catch (e) { console.error("Failed to save edited data", e); Alert.alert("Hata", "Değişiklikler kaydedilirken bir sorun oluştu."); } }, [editingItem, editTutar, editNot, dayData, date, loadDayData]);
  
  if (isLoading) { return <View style={styles.container}><ActivityIndicator size="large" color="#27ae60" /></View>; }
  if (!dayData) { return <View style={styles.container}><Text style={styles.dateText_detail}>Bu tarihe ait veri bulunamadı.</Text></View>; }
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.ozetKarti_detail}>
          <OzetSatiri_detail label="Net Kâr:" deger={formatCurrency(dayData.netKar)} renk={dayData.netKar >= 0 ? '#27ae60' : '#e74c3c'}/>
          <View style={styles.separator_detail} />
          <OzetSatiri_detail label="Toplam Kazanç:" deger={formatCurrency(dayData.toplamKazanc)} />
          <OzetSatiri_detail label="Toplam Masraf:" deger={formatCurrency(dayData.toplamMasraf)} />
          <OzetSatiri_detail label="Toplam Yol:" deger={`${dayData.toplamKm.toFixed(1)} km`} />
        </View>
        <View style={styles.listelerContainer_detail}>
          <View style={{ flex: 1 }}><Text style={styles.listeBaslik_detail}>Kazançlar</Text>{dayData.kazanclar && dayData.kazanclar.length > 0 ? ( dayData.kazanclar.map(item => <KayitItem_detail key={item.id} item={item} tip="kazanc" onEdit={() => openEditModal(item, 'kazanc')}/>)) : ( <Text style={styles.emptyText_detail}>Kazanç kaydı yok.</Text> )}</View>
          <View style={{ flex: 1 }}><Text style={styles.listeBaslik_detail}>Ekstra Masraflar</Text>{dayData.ekstraMasraflar && dayData.ekstraMasraflar.length > 0 ? ( dayData.ekstraMasraflar.map(item => <KayitItem_detail key={item.id} item={item} tip="masraf" onEdit={() => openEditModal(item, 'masraf')}/>)) : ( <Text style={styles.emptyText_detail}>Masraf kaydı yok.</Text> )}</View>
        </View>
      </ScrollView>
      <Modal animationType="fade" transparent={true} visible={isModalVisible} onRequestClose={() => setIsModalVisible(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContainer_detail}>
              <View style={styles.modalContent_detail}>
                <Text style={styles.modalTitle_detail}>Kaydı Düzenle</Text>
                <TextInput style={styles.input_detail} placeholder="Tutar" keyboardType="numeric" value={editTutar} onChangeText={setEditTutar}/>
                <TextInput style={styles.input_detail} placeholder="Not (isteğe bağlı)" value={editNot} onChangeText={setEditNot}/>
                <View style={styles.modalButtonContainer_detail}>
                    <TouchableOpacity style={[styles.button_detail, styles.cancelButton_detail]} onPress={() => setIsModalVisible(false)}><Text style={styles.buttonText_detail}>İptal</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.button_detail, styles.saveButton_detail]} onPress={handleSaveChanges}><Text style={styles.buttonText_detail}>Kaydet</Text></TouchableOpacity>
                </View>
              </View>
          </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f2f2f7', justifyContent: 'center' },
    ozetKarti_detail: { backgroundColor: '#fff', borderRadius: 10, padding: 20, margin: 15 },
    ozetSatiri_detail: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
    ozetLabel_detail: { color: '#666', fontSize: 16 },
    ozetDeger_detail: { fontSize: 16, fontWeight: 'bold', color: '#000' },
    separator_detail: { height: 1, backgroundColor: '#e5e5e5', marginVertical: 15 },
    listelerContainer_detail: { flexDirection: 'row', paddingHorizontal: 15, marginTop: 10, gap: 10, paddingBottom: 40 },
    listeBaslik_detail: { color: '#000', fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
    kayitItem_detail: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    editButton_detail: { padding: 5 },
    kayitTutar_detail: { fontWeight: 'bold', fontSize: 16 },
    notText_detail: { fontSize: 13, color: '#555', marginTop: 3 },
    dateText_detail: { color: '#000', fontWeight: 'bold', fontSize: 18, textAlign: 'center' },
    emptyText_detail: { color: '#888', textAlign: 'center', fontSize: 14, padding: 10 },
    modalContainer_detail: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.6)' },
    modalContent_detail: { width: '85%', backgroundColor: '#fff', borderRadius: 14, padding: 20 },
    modalTitle_detail: { color: '#000', fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    input_detail: { backgroundColor: '#f0f0f0', color: '#000', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 15 },
    modalButtonContainer_detail: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    button_detail: { flex: 1, padding: 15, borderRadius: 8, alignItems: 'center' },
    cancelButton_detail: { backgroundColor: '#aaa', marginRight: 5 },
    saveButton_detail: { backgroundColor: '#27ae60', marginLeft: 5 },
    buttonText_detail: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});