import jsPDF from 'jspdf';
import { Transaction, Member } from '../types';
import { formatRupiah, formatDateIndo, terbilang } from './generator';
import { SIMPANANKU_LOGO_BASE64 } from '../assets/images/simpanankuLogoBase64';

const typeLabels: Record<string, string> = {
  setoran: 'SETORAN TABUNGAN SYARIAH',
  penarikan: 'PENARIKAN TABUNGAN SYARIAH',
  gadai_pencairan: 'PENCAIRAN GADAI SYARIAH (RAHN)',
  gadai_tebus: 'PELUNASAN TEBUS GADAI (RAHN)',
  gadai_ujrah: 'PEMBAYARAN BIAYA TITIP GADAI (UJRAH)',
  kredit_pencairan: 'PENYERAHAN PEMBIAYAAN BARANG (MURABAHAH)',
  kredit_angsuran: 'PEMBAYARAN ANGSURAN KREDIT BARANG',
};

/**
 * Generate and download an official Syariah Transaction Receipt PDF.
 * Formatted cleanly in A5 Portrait for standard receipt voucher printing.
 */
export function generateReceiptPdf(
  transaction: Transaction,
  member?: Member | null,
  currentBalance?: number
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5', // 148 x 210 mm
  });

  const pageWidth = 148;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  let y = 14;

  // Header Banner with Official Logo
  doc.setFillColor(6, 78, 59); // Emerald 900
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'F');

  try {
    // Official Simpananku Logo
    doc.addImage(SIMPANANKU_LOGO_BASE64, 'JPEG', margin + 3, y + 2.5, 17, 17);
  } catch (err) {
    console.error('Failed to embed logo in PDF:', err);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.text('SIMPANANKU', margin + 23, y + 7.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Simpanan Tabungan • Gadai Syariah (Rahn) • Kredit Barang (Murabahah)', margin + 23, y + 12.5);
  doc.setFontSize(6.5);
  doc.setTextColor(209, 250, 229); // Emerald 100
  doc.text('Sistem Informasi khusus anggota SIMPANANKU by. WAROENG HIJI', margin + 23, y + 16.5);

  y += 26;

  // Receipt Title & Verification Status
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('BUKTI TRANSAKSI KASIR', pageWidth / 2, y, { align: 'center' });

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, pageWidth / 2, y, { align: 'center' });

  y += 5;

  // Horizontal Divider
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);

  y += 5;

  // Transaction Info Grid
  const leftX = margin + 2;
  const colValX = margin + 42;

  const drawRow = (label: string, value: string, isBold: boolean = false, textColor = [15, 23, 42]) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(label, leftX, y);

    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(value, colValX, y);
    y += 5;
  };

  drawRow('No. Referensi', transaction.referenceNumber, true);
  drawRow('Waktu Transaksi', formatDateIndo(transaction.createdAt));
  drawRow('Kasir / Teller', transaction.tellerName || 'Teller Layanan');
  drawRow('Status', (transaction.status || 'BERHASIL').toUpperCase(), true, [6, 95, 70]);

  y += 2;
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  drawRow('No. Anggota (Rekening)', transaction.memberNumber, true, [6, 95, 70]);
  drawRow('Nama Nasabah', member?.fullName || transaction.memberName || 'Nasabah Terdaftar', true);
  if (member?.phone) {
    drawRow('No. Handphone / WA', member.phone);
  }

  y += 2;
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  const transTypeLabel = typeLabels[transaction.type] || transaction.type.replace('_', ' ').toUpperCase();
  drawRow('Jenis Transaksi', transTypeLabel, true);
  drawRow('Akad Syariah', `Akad ${(transaction.akad || 'Wadi\'ah').toUpperCase()}`);
  drawRow('Metode Bayar', (transaction.paymentMethod || 'TUNAI').toUpperCase());

  if (transaction.notes) {
    drawRow('Keterangan / Memo', transaction.notes);
  }

  y += 3;

  // Big Amount Highlight Box
  doc.setFillColor(240, 253, 244); // Emerald 50
  doc.setDrawColor(187, 247, 208); // Emerald 200
  doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(21, 128, 61); // Emerald 700
  doc.text('TOTAL NOMINAL TRANSAKSI', margin + 4, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(6, 78, 59); // Emerald 900
  doc.text(formatRupiah(transaction.amount), pageWidth - margin - 4, y + 8, { align: 'right' });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Terbilang: ${terbilang(transaction.amount)} Rupiah`, margin + 4, y + 14);

  y += 23;

  if (currentBalance !== undefined) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Sisa Saldo Tabungan:', margin + 2, y);
    doc.setTextColor(6, 95, 70);
    doc.text(formatRupiah(currentBalance), pageWidth - margin - 2, y, { align: 'right' });
    y += 6;
  }

  // Security Note & Code
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Kode Otentikasi Struk: ${transaction.receiptCode || transaction.referenceNumber} • Sah tanpa materai`, pageWidth / 2, y + 5, { align: 'center' });

  y += 14;

  // Signatures Section
  const col1X = margin + 20;
  const col2X = pageWidth - margin - 20;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Nasabah / Penyetor,', col1X, y, { align: 'center' });
  doc.text('Kasir / Teller Bertugas,', col2X, y, { align: 'center' });

  y += 18;

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.3);
  doc.line(col1X - 18, y, col1X + 18, y);
  doc.line(col2X - 18, y, col2X + 18, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(member?.fullName || transaction.memberName || 'Nasabah', col1X, y + 4, { align: 'center' });
  doc.text(transaction.tellerName || 'Teller', col2X, y + 4, { align: 'center' });

  // Save the document
  const fileName = `Bukti_Transaksi_${transaction.referenceNumber}_${transaction.memberNumber}.pdf`;
  doc.save(fileName);
}
