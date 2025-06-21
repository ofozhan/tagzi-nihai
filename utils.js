// Bu dosyanın adı: utils.js

// PARA BİRİMİ FORMATLAMA FONKSİYONU
export const formatCurrency = (number) => {
  const roundedUpValue = Math.ceil(number || 0);
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(roundedUpValue);
};

// BUGÜNÜN TARİHİNİ ALAN FONKSİYON
export const getTodayDateString = () => new Date().toISOString().split('T')[0];