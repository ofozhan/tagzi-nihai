import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, SafeAreaView, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { subDays, startOfMonth, isWithinInterval } from 'date-fns';
import { formatCurrency } from '../utils';

const SummaryBox = ({ label, value }) => (
  <View style={styles.summaryBox}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={styles.summaryValue}>{formatCurrency(value)}</Text>
  </View>
);

export default function HistoryScreen({ navigation }) { 
  const [allData, setAllData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const loadAllData = async () => {
        setIsLoading(true);
        try {
          const allKeys = await AsyncStorage.getAllKeys();
          const dataKeys = allKeys.filter(key => key.startsWith('@TagziApp:data_'));
          const dataPairs = await AsyncStorage.multiGet(dataKeys);
          
          const parsedData = dataPairs.map(pair => {
            if (!pair[1]) return null;
            const date = pair[0].split('_')[1];
            const dayData = JSON.parse(pair[1]);
            const toplamKazanc = (dayData.kazanclar || []).reduce((sum, item) => sum + item.tutar, 0);
            const baslangic = parseFloat(dayData.startKm) || 0;
            const bitis = parseFloat(dayData.endKm) || 0;
            const maliyetPerKm = parseFloat(dayData.yakitMaliyeti) || 0;
            const toplamKm = bitis > baslangic ? bitis - baslangic : 0;
            const yakitMasrafi = toplamKm * maliyetPerKm;
            const toplamEkstraMasraf = (dayData.ekstraMasraflar || []).reduce((sum, item) => sum + item.tutar, 0);
            const toplamMasraf = yakitMasrafi + toplamEkstraMasraf;
            const netKar = toplamKazanc - toplamMasraf;
            return { date, toplamKazanc, netKar };
          }).filter(item => item && item.date !== getTodayDateString()) // GÜNÜ BİTİRMEMİŞ GÜNÜ GÖSTERME
          .sort((a, b) => new Date(b.date) - new Date(a.date));
          setAllData(parsedData);
        } catch (e) { console.error("Failed to load history data", e); } 
        finally { setIsLoading(false); }
      };
      loadAllData();
    }, [])
  );
  
  const summary = useMemo(() => {
    const now = new Date();
    const last7DaysInterval = { start: subDays(now, 6), end: now };
    const thisMonthInterval = { start: startOfMonth(now), end: now };
    let totalEarnings = 0, last7DaysEarnings = 0, thisMonthEarnings = 0;
    for (const day of allData) {
      const dayDate = new Date(day.date);
      totalEarnings += day.toplamKazanc;
      if (isWithinInterval(dayDate, last7DaysInterval)) { last7DaysEarnings += day.toplamKazanc; }
      if (isWithinInterval(dayDate, thisMonthInterval)) { thisMonthEarnings += day.toplamKazanc; }
    }
    return { totalEarnings, last7DaysEarnings, thisMonthEarnings };
  }, [allData]);

  if (isLoading) {
    return <View style={styles.container}><ActivityIndicator size="large" color="#27ae60" /></View>;
  }

  const renderHistoryItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.historyItem} 
      onPress={() => navigation.navigate('DayDetail', { date: item.date })}
    >
      <Text style={styles.dateText}>{new Date(item.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
      <View>
        <Text style={styles.earningsText}>Kazanç: {formatCurrency(item.toplamKazanc)}</Text>
        <Text style={[styles.netProfitText, { color: item.netKar >= 0 ? '#27ae60' : '#e74c3c' }]}>Net Kâr: {formatCurrency(item.netKar)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.summaryContainer}>
        <SummaryBox label="Son 7 Gün" value={summary.last7DaysEarnings} />
        <SummaryBox label="Bu Ay" value={summary.thisMonthEarnings} />
        <SummaryBox label="Toplam" value={summary.totalEarnings} />
      </View>
      <FlatList
        data={allData}
        renderItem={renderHistoryItem}
        keyExtractor={item => item.date}
        ListEmptyComponent={<Text style={styles.emptyText}>Henüz geçmiş bir kayıt bulunmuyor.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f2f2f7', justifyContent: 'center' },
    summaryContainer: { flexDirection: 'row', justifyContent: 'space-around', padding: 10 },
    summaryBox: { flex: 1, backgroundColor: '#fff', padding: 15, borderRadius: 10, margin: 5, alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 1, }, shadowOpacity: 0.18, shadowRadius: 1.00, elevation: 1, },
    summaryLabel: { color: '#666', fontSize: 12, textAlign: 'center' },
    summaryValue: { color: '#000', fontWeight: 'bold', fontSize: 16, marginTop: 5 },
    historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 20, marginHorizontal: 15, marginVertical: 6, borderRadius: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1, }, shadowOpacity: 0.18, shadowRadius: 1.00, elevation: 1, },
    dateText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
    earningsText: { color: '#555', fontSize: 14, textAlign: 'right' },
    netProfitText: { fontWeight: 'bold', fontSize: 14, textAlign: 'right' },
    emptyText: { color: '#888', textAlign: 'center', marginTop: 50, fontSize: 16 }
});