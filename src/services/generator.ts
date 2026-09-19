import { Transaction, PawnPledge, CommodityFinancing, Member } from '../types';

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateIndo(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function generateMemberNumber(existing: { memberNumber?: string }[] | number): string {
  if (Array.isArray(existing)) {
    let maxNum = 0;
    for (const item of existing) {
      if (item.memberNumber) {
        const numPart = parseInt(item.memberNumber.replace(/\D/g, ''), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    }
    const nextNum = maxNum + 1;
    return `AG${String(nextNum).padStart(4, '0')}`;
  }
  const nextNum = existing + 1;
  return `AG${String(nextNum).padStart(4, '0')}`;
}

export function generateReferenceNumber(prefix: string = 'TRX'): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}${month}${day}-${rand}`;
}

// Convert number to Indonesian Words (Terbilang) for Islamic Bank Receipt
export function terbilang(bilangan: number): string {
  const angka = [
    '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima',
    'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'
  ];
  const n = Math.floor(bilangan);

  if (n < 12) {
    return angka[n];
  } else if (n < 20) {
    return terbilang(n - 10) + ' Belas';
  } else if (n < 100) {
    return terbilang(Math.floor(n / 10)) + ' Puluh ' + terbilang(n % 10);
  } else if (n < 200) {
    return 'Seratus ' + terbilang(n - 100);
  } else if (n < 1000) {
    return terbilang(Math.floor(n / 100)) + ' Ratus ' + terbilang(n % 100);
  } else if (n < 2000) {
    return 'Seribu ' + terbilang(n - 1000);
  } else if (n < 1000000) {
    return terbilang(Math.floor(n / 1000)) + ' Ribu ' + terbilang(n % 1000);
  } else if (n < 1000000000) {
    return terbilang(Math.floor(n / 1000000)) + ' Juta ' + terbilang(n % 1000000);
  } else if (n < 1000000000000) {
    return terbilang(Math.floor(n / 1000000000)) + ' Miliar ' + terbilang(n % 1000000000);
  }
  return String(bilangan);
}

// Generate formatted WhatsApp message for transaction receipt
export function generateWhatsAppMessage(
  trx: Transaction,
  member?: Member | null,
  currentBalance?: number
): string {
  const typeMap: Record<string, string> = {
    setoran: 'SETORAN TABUNGAN SYARIAH',
    penarikan: 'PENARIKAN TABUNGAN SYARIAH',
    gadai_pencairan: 'PENCAIRAN GADAI SYARIAH (RAHN)',
    gadai_tebus: 'PELUNASAN / TEBUS GADAI (RAHN)',
    gadai_ujrah: 'PEMBAYARAN UJRAH GADAI',
    kredit_pencairan: 'PENYERAHAN KREDIT BARANG (MURABAHAH)',
    kredit_angsuran: 'PEMBAYARAN ANGSURAN BARANG',
  };

  const akadMap: Record<string, string> = {
    wadiah: 'Wadi\'ah Yad Dhamanah (Titipan Bergaransi)',
    mudharabah: 'Mudharabah Muthlaqah (Bagi Hasil)',
    rahn: 'Rahn & Ijarah (Gadai Syariah & Biaya Titip)',
    murabahah: 'Murabahah (Jual Beli Margin Terbuka)',
  };

  const memberName = member?.fullName || trx.memberName || 'Nasabah Terdaftar';
  const memberNik = member?.nik && member.nik.length >= 10
    ? `${member.nik.slice(0, 6)}******${member.nik.slice(-4)}`
    : member?.nik || '-';

  let msg = `*BUKTI TRANSAKSI ELEKTRONIK*\n`;
  msg += `*SIMPANANKU*\n`;
  msg += `_Simpanan Tabungan • Gadai Syariah (Rahn) • Kredit Barang (Murabahah)_\n`;
  msg += `============================\n`;
  msg += `*No. Referensi:* ${trx.referenceNumber}\n`;
  msg += `*Tanggal:* ${formatDateIndo(trx.createdAt)}\n`;
  msg += `*Teller / Kasir:* ${trx.tellerName}\n`;
  msg += `----------------------------\n`;
  msg += `*Data Nasabah:*\n`;
  msg += `• No. Anggota: *${trx.memberNumber}*\n`;
  msg += `• Nama: ${memberName}\n`;
  msg += `• NIK: ${memberNik}\n`;
  msg += `----------------------------\n`;
  msg += `*Jenis Transaksi:* ${typeMap[trx.type] || trx.type.toUpperCase()}\n`;
  msg += `*Akad Syariah:* ${akadMap[trx.akad] || trx.akad}\n`;
  msg += `*Nominal:* *${formatRupiah(trx.amount)}*\n`;
  msg += `*Terbilang:* _${terbilang(trx.amount)} Rupiah_\n`;
  if (currentBalance !== undefined) {
    msg += `*Saldo Berjalan:* ${formatRupiah(currentBalance)}\n`;
  }
  if (trx.notes) {
    msg += `*Keterangan:* ${trx.notes}\n`;
  }
  msg += `*Status:* BERHASIL (LUNAS)\n`;
  msg += `============================\n`;
  msg += `_Simpan pesan ini sebagai bukti sah transaksi._\n`;
  msg += `_Dikelola murni syariah tanpa Riba, Gharar, dan Maysir._\n`;
  msg += `Layanan Pelanggan: +62 898-6924-500\n`;
  msg += `https://simpananku.my.id/verify/${trx.receiptCode}`;

  return msg;
}

export function createWhatsAppLink(phone: string, text: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return `https://api.whatsapp.com/send?phone=${cleaned}&text=${encodeURIComponent(text)}`;
}
