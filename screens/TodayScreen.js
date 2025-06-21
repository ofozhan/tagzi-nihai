import React, { useState, useMemo, useEffect } from 'react';
import {
  SafeAreaView, View, Text, TextInput, TouchableOpacity,
  StyleSheet, Keyboard, TouchableWithoutFeedback, Alert, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { formatCurrency, getTodayDateString } from '../utils';

// YARDIMCI COMPONENTLER
const OzetSatiri = ({ label, deger, renk }) => (<View style={styles.ozetSatiri}><Text style={styles.ozetLabel}>{label}</Text><Text style={[styles.ozetDeger, { color: renk }]}>{deger}</Text></View>);
const InputGrup = ({ etiket, ...props }) => (<View style={{ marginBottom: 10, flex: 1, paddingHorizontal: 4 }}><Text style={styles.inputLabel}>{etiket}</Text><TextInput style={styles.input} keyboardType="numeric" placeholderTextColor="#aaa" {...props} /></View>);

// ANA EKRAN COMPONENT'İ
export default function TodayScreen() {
  const [today, setToday] = useState(getTodayDateString());
  const [startKm, setStartKm] = useState('');
  const [endKm, setEndKm] = useState('');
  const [yakitMaliyeti, setYakitMaliyeti] = useState('4.0');
  const [kazanclar, setKazanclar] = useState([]);
  const [ekstraMasraflar, setEkstraMasraflar] = useState([]);
  const [inputTutar, setInputTutar] = useState('');
  const [inputNot, setInputNot] = useState('');
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isKmSectionVisible, setIsKmSectionVisible] = useState(false);
  const [isRecordSectionVisible, setIsRecordSectionVisible] = useState(false);
  const [sound, setSound] = useState();

  useEffect(() => {
    async function loadSound() {
      try {
        const { sound } = await Audio.Sound.createAsync(
           require('../assets/sounds/kasa-sesi.mp3')
        );
        setSound(sound);
      } catch (error) { console.error("Ses dosyası yüklenirken hata:", error); }
    }
    loadSound();
    return () => { if (sound) { sound.unloadAsync(); } };
  }, []);

  useEffect(() => {
    const todayStorageKey = `@TagziApp:data_${today}`;
    const loadData = async () => {
      setIsDataLoaded(false);
      try {
        const savedDataString = await AsyncStorage.getItem(todayStorageKey);
        if (savedDataString !== null) {
          const savedData = JSON.parse(savedDataString);
          setStartKm(savedData.startKm || '');
          setEndKm(savedData.endKm || '');
          setYakitMaliyeti(savedData.yakitMaliyeti || '4.0');
          setKazanclar(savedData.kazanclar || []);
          setEkstraMasraflar(savedData.ekstraMasraflar || []);
        } else {
          const yesterdayDate = new Date();
          yesterdayDate.setDate(new Date().getDate() - 1);
          const yesterdayString = yesterdayDate.toISOString().split('T')[0];
          const yesterdayStorageKey = `@TagziApp:data_${yesterdayString}`;
          const yesterdayDataString = await AsyncStorage.getItem(yesterdayStorageKey);
          let previousEndKm = '';
          if (yesterdayDataString !== null) {
            const yesterdayData = JSON.parse(yesterdayDataString);
            if(yesterdayData.endKm) { previousEndKm = yesterdayData.endKm; }
          }
          setStartKm(previousEndKm);
          setEndKm('');
          setKazanclar([]);
          setEkstraMasraflar([]);
        }
      } catch (e) { console.error('Veriler yüklenirken hata oluştu', e); } 
      finally { setIsDataLoaded(true); }
    };
    loadData();
  }, [today]);

  useEffect(() => {
    if (!isDataLoaded) return;
    const todayStorageKey = `@TagziApp:data_${today}`;
    const saveData = async () => {
      try {
        const dataToSave = { startKm, endKm, yakitMaliyeti, kazanclar, ekstraMasraflar };
        const dataString = JSON.stringify(dataToSave);
        await AsyncStorage.setItem(todayStorageKey, dataString);
      } catch (e) { console.error('Failed to save data', e); }
    };
    saveData();
  }, [startKm, endKm, yakitMaliyeti, kazanclar, ekstraMasraflar]);

  const validateEndKm = () => { const startValue = parseFloat(startKm); const endValue = parseFloat(endKm); if (endValue > 0 && startValue > 0 && endValue < startValue) { Alert.alert("Hatalı Giriş", "Gün sonu kilometresi, gün başı kilometresinden düşük olamaz.", [{ text: "Tamam", onPress: () => setEndKm('') }]); } };
  const handleEndDay = () => Alert.alert("Günü Bitir", "Bugünkü veriler kaydedilecek ve ekran yeni bir gün için sıfırlanacak. Emin misiniz?", [{ text: "İptal", style: "cancel" }, { text: "Evet, Bitir", onPress: () => { setStartKm(endKm); setEndKm(''); setKazanclar([]); setEkstraMasraflar([]); setInputTutar(''); setInputNot(''); setToday(getTodayDateString()); Alert.alert("Gün Bitti", "Verileriniz kaydedildi. Ekran yeni gün için hazır!"); }, style: "destructive" }]);
  
  async function playSound() { if (sound) { await sound.replayAsync(); } }
  const handleKayitEkle = async (tip) => { const tutar = parseFloat(inputTutar); if (!tutar || tutar <= 0) { Alert.alert('Hata', 'Lütfen geçerli bir tutar girin.'); return; } await playSound(); const yeniKayit = { id: Date.now().toString(), tutar, not: inputNot }; if (tip === 'kazanc') { setKazanclar(onceki => [yeniKayit, ...onceki]); } else { setEkstraMasraflar(onceki => [yeniKayit, ...onceki]); } setInputTutar(''); setInputNot(''); Keyboard.dismiss(); };
  const gunlukOzet = useMemo(() => { const baslangic = parseFloat(startKm) || 0; const bitis = parseFloat(endKm) || 0; const maliyetPerKm = parseFloat(yakitMaliyeti.replace(',', '.')) || 0; const toplamKm = bitis > baslangic ? bitis - baslangic : 0; const yakitMasrafi = toplamKm * maliyetPerKm; const toplamKazanc = kazanclar.reduce((acc, val) => acc + val.tutar, 0); const toplamEkstraMasraf = ekstraMasraflar.reduce((acc, val) => acc + val.tutar, 0); const toplamMasraf = yakitMasrafi + toplamEkstraMasraf; const netKar = toplamKazanc - toplamMasraf; return { toplamKm, yakitMasrafi, toplamKazanc, toplamEkstraMasraf, toplamMasraf, netKar }; }, [startKm, endKm, yakitMaliyeti, kazanclar, ekstraMasraflar]);

  const renderKayit = (item, tip) => (<View key={item.id} style={styles.kayitItem}><Text style={[styles.kayitTutar, { color: tip === 'kazanc' ? '#2ecc71' : '#e74c3c' }]}>{tip === 'kazanc' ? '+ ' : '- '}{formatCurrency(item.tutar)}</Text>{item.not ? <Text style={styles.notText}>{item.not}</Text> : null}</View>);
  
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <ScrollView>
          <View style={styles.ozetKarti}><Text style={styles.ozetLabel}>GÜN SONU NET KÂR/ZARAR</Text><Text style={[styles.netKarText, { color: gunlukOzet?.netKar >= 0 ? '#27ae60' : '#e74c3c' }]}>{formatCurrency(gunlukOzet?.netKar)}</Text><View style={styles.separator} /><OzetSatiri label="Toplam Kazanç:" deger={formatCurrency(gunlukOzet?.toplamKazanc)} renk="#2ecc71" /><OzetSatiri label="Toplam Masraf:" deger={formatCurrency(gunlukOzet?.toplamMasraf)} renk="#e74c3c" /><Text style={styles.masrafDetay}>(Yakıt: {formatCurrency(gunlukOzet?.yakitMasrafi)} + Ekstra: {formatCurrency(gunlukOzet?.toplamEkstraMasraf)})</Text><OzetSatiri label="Toplam Yol:" deger={`${gunlukOzet?.toplamKm?.toFixed(1) || 0} km`} /></View>
          <View style={styles.formKarti}><TouchableOpacity style={styles.collapsibleHeader} onPress={() => setIsKmSectionVisible(!isKmSectionVisible)}><Text style={styles.formBaslik}>Kilometre ve Yakıt</Text><Ionicons name={isKmSectionVisible ? "chevron-up" : "chevron-down"} size={24} color="#333" /></TouchableOpacity>{isKmSectionVisible && (<View style={styles.collapsibleContent}><View style={{ flexDirection: 'row', gap:10 }}><InputGrup etiket="Gün Başı KM" value={startKm} onChangeText={setStartKm} placeholder="150000" returnKeyType="done" /><InputGrup etiket="Gün Sonu KM" value={endKm} onChangeText={setEndKm} placeholder="150250" onBlur={validateEndKm} returnKeyType="done" /></View><InputGrup etiket="KM Başına Yakıt Maliyeti (TL)" value={yakitMaliyeti} onChangeText={setYakitMaliyeti} returnKeyType="done" onSubmitEditing={Keyboard.dismiss} /></View>)}</View>
          <View style={styles.formKarti}><TouchableOpacity style={styles.collapsibleHeader} onPress={() => setIsRecordSectionVisible(!isRecordSectionVisible)}><Text style={styles.formBaslik}>Yeni Kayıt Ekle</Text><Ionicons name={isRecordSectionVisible ? "chevron-up" : "chevron-down"} size={24} color="#333" /></TouchableOpacity>{isRecordSectionVisible && (<View style={styles.collapsibleContent}><InputGrup etiket="Tutar (TL)" value={inputTutar} onChangeText={setInputTutar} placeholder="Örn: 150" returnKeyType="done" /><InputGrup etiket="Not (İsteğe Bağlı)" value={inputNot} onChangeText={setInputNot} keyboardType="default" returnKeyType="done" onSubmitEditing={Keyboard.dismiss}/><View style={{ flexDirection: 'row', marginTop: 10, gap:10 }}><TouchableOpacity style={[styles.button, { backgroundColor: '#2ecc71' }]} onPress={() => handleKayitEkle('kazanc')}><Text style={styles.buttonText}>KAZANÇ</Text></TouchableOpacity><TouchableOpacity style={[styles.button, { backgroundColor: '#e74c3c' }]} onPress={() => handleKayitEkle('masraf')}><Text style={styles.buttonText}>MASRAF</Text></TouchableOpacity></View></View>)}</View>
          <View style={styles.listelerContainer}>
            <View style={styles.listWrapper}><Text style={styles.listeBaslik}>Kazançlar</Text>{kazanclar.length > 0 ? kazanclar.map(item => renderKayit(item, 'kazanc')) : <Text style={styles.emptyListText}>Kayıt yok</Text>}</View>
            <View style={styles.listWrapper}><Text style={styles.listeBaslik}>Ekstra Masraflar</Text>{ekstraMasraflar.length > 0 ? ekstraMasraflar.map(item => renderKayit(item, 'masraf')) : <Text style={styles.emptyListText}>Kayıt yok</Text>}</View>
          </View>
          <TouchableOpacity style={styles.endDayButton} onPress={handleEndDay}><Ionicons name="archive-outline" size={20} color="white" /><Text style={styles.endDayButtonText}>Günü Bitir ve Sıfırla</Text></TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f2f2f7' },
    ozetKarti: { backgroundColor: '#fff', borderRadius: 10, padding: 20, margin: 15, shadowColor: "#000", shadowOffset: { width: 0, height: 1, }, shadowOpacity: 0.20, shadowRadius: 1.41, elevation: 2, },
    ozetLabel: { color: '#666', fontSize: 16, textAlign: 'center', textTransform: 'uppercase', marginBottom: 4 },
    netKarText: { fontSize: 36, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
    ozetSatiri: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
    ozetDeger: { fontSize: 16, fontWeight: 'bold', color: '#000' },
    separator: { height: 1, backgroundColor: '#e5e5e5', marginVertical: 15 },
    masrafDetay: { fontSize: 12, color: '#888', textAlign: 'right', marginTop: -4, marginBottom: 8 },
    formKarti: { backgroundColor: '#fff', borderRadius: 10, padding: 20, marginHorizontal: 15, marginBottom: 15, shadowColor: "#000", shadowOffset: { width: 0, height: 1, }, shadowOpacity: 0.20, shadowRadius: 1.41, elevation: 2, },
    collapsibleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    formBaslik: { color: '#000', fontSize: 18, fontWeight: 'bold' },
    collapsibleContent: { marginTop: 20 },
    inputLabel: { color: '#555', fontSize: 14, marginBottom: 5 },
    input: { backgroundColor: '#f0f0f0', color: '#000', borderRadius: 8, padding: 12, fontSize: 16 },
    button: { paddingVertical: 15, borderRadius: 8, alignItems: 'center', flex: 1 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    listelerContainer: { flexDirection: 'row', paddingHorizontal: 15, marginTop: 10, gap: 10, marginBottom: 20 },
    listWrapper: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1, }, shadowOpacity: 0.22, shadowRadius: 2.22, elevation: 3, minHeight: 150 },
    listeBaslik: { color: '#000', fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
    kayitItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    kayitTutar: { fontWeight: 'bold', fontSize: 16 },
    notText: { fontSize: 13, color: '#555', marginTop: 3 },
    emptyListText: { textAlign: 'center', color: '#999', marginTop: 20 },
    endDayButton: { backgroundColor: '#c0392b', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 10, marginHorizontal: 15, marginBottom: 40 },
    endDayButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16, marginLeft: 10 },
});