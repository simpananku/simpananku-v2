import jsPDF from 'jspdf';
import { Member, SavingsAccount, Transaction } from '../types';
import { formatRupiah, formatDateIndo } from './generator';
import { SIMPANANKU_LOGO_BASE64 } from '../assets/images/simpanankuLogoBase64';

/**
 * Generate and download an official Passbook and Transaction Mutation PDF (Buku Tabungan & Mutasi)
 * Formatted in A4 Portrait standard banking passbook style.
 */
export function generatePassbookPdf(
  member: Member,
  accounts: SavingsAccount[],
  transactions: Transaction[],
  tellerName: string = 'Teller Syariah'
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4', // 210 x 297 mm
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182 mm
  let y = 12;

  // Helper for drawing header on new pages if needed
  const drawPageHeader = (isFirstPage: boolean = true) => {
    if (isFirstPage) {
      // Emerald Header Banner
      doc.setFillColor(6, 78, 59); // Emerald 900
      doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'F');

      // Logo Simpananku
      try {
        doc.addImage(SIMPANANKU_LOGO_BASE64, 'JPEG', margin + 3.5, y + 3, 18, 18);
      } catch (err) {
        console.error('Failed to embed logo in passbook PDF:', err);
      }

      // Title & Branding inside banner
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('SIMPANANKU', margin + 25, y + 8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Simpanan Tabungan • Gadai Syariah (Rahn) • Kredit Barang (Murabahah)', margin + 25, y + 13.5);
      doc.setFontSize(7);
      doc.setTextColor(209, 250, 229); // Emerald 100
      doc.text('Sistem Informasi khusus anggota SIMPANANKU by. WAROENG HIJI', margin + 25, y + 18);

      y += 28;

      // Document Title
      doc.setTextColor(15, 23, 42); // Slate 900
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('BUKU TABUNGAN & MUTASI REKENING', pageWidth / 2, y, { align: 'center' });

      y += 4.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139); // Slate 500
      doc.text(
        'Laporan Resmi Pembukuan Rekening Simpanan Syariah Bebas Riba, Gharar, & Maysir',
        pageWidth / 2,
        y,
        { align: 'center' }
      );

      y += 6;
    } else {
      // Minimal Header for subsequent pages
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(6, 78, 59);
      doc.text(`SIMPANANKU - Buku Tabungan & Mutasi (${member.memberNumber} - ${member.fullName})`, margin + 2, y + 5);
      y += 12;
    }
  };

  // Draw first page header
  drawPageHeader(true);

  // Filter personal data
  const myAccounts = accounts.filter((a) => a.memberNumber === member.memberNumber);
  const myTransactions = transactions
    .filter((t) => t.memberNumber === member.memberNumber)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const totalBalance = myAccounts.reduce((acc, a) => acc + a.balance, 0);

  // -------------------------------------------------------------
  // Member & Account Info Box
  // -------------------------------------------------------------
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.roundedRect(margin, y, contentWidth, 24, 1.5, 1.5, 'FD');

  const col1X = margin + 4;
  const col2X = margin + (contentWidth / 2) + 4;
  let infoY = y + 5;

  doc.setFontSize(7.5);

  // Column 1
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Nomor Anggota:', col1X, infoY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(6, 95, 70); // Emerald 800
  doc.text(member.memberNumber, col1X + 26, infoY);

  infoY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Nama Nasabah:', col1X, infoY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(member.fullName, col1X + 26, infoY);

  infoY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('NIK:', col1X, infoY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(member.nik || '-', col1X + 26, infoY);

  infoY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('No. Handphone / WA:', col1X, infoY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(member.phone || '-', col1X + 26, infoY);

  // Column 2
  infoY = y + 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Tanggal Cetak:', col2X, infoY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const printDateStr = formatDateIndo(new Date().toISOString());
  doc.text(printDateStr, col2X + 26, infoY);

  infoY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Petugas / Teller:', col2X, infoY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(tellerName, col2X + 26, infoY);

  infoY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Alamat Nasabah:', col2X, infoY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  const shortAddress = member.address && member.address.length > 38 
    ? member.address.slice(0, 38) + '...' 
    : member.address || '-';
  doc.text(shortAddress, col2X + 26, infoY);

  infoY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Total Saldo Tabungan:', col2X, infoY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(6, 95, 70);
  doc.text(formatRupiah(totalBalance), col2X + 26, infoY);

  y += 28;

  // -------------------------------------------------------------
  // Registered Savings Accounts Mini Table
  // -------------------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('DAFTAR REKENING SIMPANAN TERDAFTAR:', margin, y);
  y += 3.5;

  // Table header for accounts
  doc.setFillColor(241, 245, 249); // Slate 100
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.rect(margin, y, contentWidth, 6, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('Nama Produk Simpanan', margin + 3, y + 4);
  doc.text('Akad Syariah', margin + 70, y + 4);
  doc.text('Status', margin + 110, y + 4);
  doc.text('Saldo Rekening', margin + contentWidth - 3, y + 4, { align: 'right' });

  y += 6;

  if (myAccounts.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Belum ada rekening simpanan aktif terdaftar.', margin + 3, y + 4);
    y += 6;
  } else {
    myAccounts.forEach((acc) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(acc.productName, margin + 3, y + 4);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Akad ${acc.akad.toUpperCase()}`, margin + 70, y + 4);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(6, 95, 70);
      doc.text('AKTIF', margin + 110, y + 4);

      doc.setTextColor(6, 95, 70);
      doc.text(formatRupiah(acc.balance), margin + contentWidth - 3, y + 4, { align: 'right' });

      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 5.5, margin + contentWidth, y + 5.5);
      y += 6;
    });
  }

  y += 5;

  // -------------------------------------------------------------
  // Transactions Mutation Ledger Table
  // -------------------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('CATATAN MUTASI TRANSAKSI REKENING:', margin, y);
  y += 3.5;

  // Table Column Definitions (Total: 182 mm)
  // No: 8mm, Tanggal: 22mm, Ref: 30mm, Keterangan: 52mm, Debit: 22mm, Kredit: 22mm, Saldo: 26mm
  const colW = {
    no: 8,
    date: 22,
    ref: 30,
    desc: 52,
    debit: 22,
    credit: 22,
    balance: 26,
  };

  const drawTableHeader = (currentY: number) => {
    doc.setFillColor(6, 78, 59); // Emerald 900
    doc.rect(margin, currentY, contentWidth, 6.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(255, 255, 255);

    let curX = margin;
    doc.text('NO', curX + colW.no / 2, currentY + 4.2, { align: 'center' });
    curX += colW.no;

    doc.text('TANGGAL', curX + 2, currentY + 4.2);
    curX += colW.date;

    doc.text('REFERENSI', curX + 2, currentY + 4.2);
    curX += colW.ref;

    doc.text('KETERANGAN & AKAD', curX + 2, currentY + 4.2);
    curX += colW.desc;

    doc.text('DEBIT (-)', curX + colW.debit - 2, currentY + 4.2, { align: 'right' });
    curX += colW.debit;

    doc.text('KREDIT (+)', curX + colW.credit - 2, currentY + 4.2, { align: 'right' });
    curX += colW.credit;

    doc.text('SALDO AKHIR', curX + colW.balance - 2, currentY + 4.2, { align: 'right' });
  };

  drawTableHeader(y);
  y += 6.5;

  if (myTransactions.length === 0) {
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, y, contentWidth, 12, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Belum ada catatan mutasi transaksi pada rekening ini.', pageWidth / 2, y + 7, { align: 'center' });
    y += 14;
  } else {
    let runningCalc = 0;
    let totalDebit = 0;
    let totalCredit = 0;

    myTransactions.forEach((trx, idx) => {
      const isIncoming = ['setoran', 'kredit_angsuran', 'gadai_tebus'].includes(trx.type);
      if (isIncoming) {
        runningCalc += trx.amount;
        totalCredit += trx.amount;
      } else {
        runningCalc = Math.max(0, runningCalc - trx.amount);
        totalDebit += trx.amount;
      }

      // Check if we need a new page
      if (y > pageHeight - 38) {
        doc.addPage();
        y = 14;
        drawPageHeader(false);
        drawTableHeader(y);
        y += 6.5;
      }

      // Alternating row background
      if (idx % 2 === 0) {
        doc.setFillColor(255, 255, 255);
      } else {
        doc.setFillColor(248, 250, 252);
      }
      doc.rect(margin, y, contentWidth, 6, 'F');

      let curX = margin;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(100, 116, 139);

      // No
      doc.text(String(idx + 1), curX + colW.no / 2, y + 4.2, { align: 'center' });
      curX += colW.no;

      // Date
      const d = new Date(trx.createdAt);
      const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear().toString().slice(-2)}`;
      doc.text(dateStr, curX + 2, y + 4.2);
      curX += colW.date;

      // Ref
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(trx.referenceNumber, curX + 2, y + 4.2);
      curX += colW.ref;

      // Keterangan
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const noteText = trx.notes.length > 32 ? trx.notes.slice(0, 32) + '..' : trx.notes;
      doc.text(noteText, curX + 2, y + 4.2);
      curX += colW.desc;

      // Debit (-)
      if (!isIncoming) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(225, 29, 72); // Rose 600
        doc.text(formatRupiah(trx.amount), curX + colW.debit - 2, y + 4.2, { align: 'right' });
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text('-', curX + colW.debit - 2, y + 4.2, { align: 'right' });
      }
      curX += colW.debit;

      // Credit (+)
      if (isIncoming) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(5, 150, 105); // Emerald 600
        doc.text(formatRupiah(trx.amount), curX + colW.credit - 2, y + 4.2, { align: 'right' });
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text('-', curX + colW.credit - 2, y + 4.2, { align: 'right' });
      }
      curX += colW.credit;

      // Running Balance
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(formatRupiah(runningCalc), curX + colW.balance - 2, y + 4.2, { align: 'right' });

      // Subtle row border
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 6, margin + contentWidth, y + 6);

      y += 6;
    });

    // Total Row
    doc.setFillColor(241, 245, 249); // Slate 100
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, y, contentWidth, 6.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text('TOTAL REKAPITULASI MUTASI', margin + colW.no + colW.date + colW.ref + 2, y + 4.3);

    // Total Debit
    const totalDebitX = margin + colW.no + colW.date + colW.ref + colW.desc + colW.debit - 2;
    doc.setTextColor(225, 29, 72);
    doc.text(formatRupiah(totalDebit), totalDebitX, y + 4.3, { align: 'right' });

    // Total Credit
    const totalCreditX = totalDebitX + colW.credit;
    doc.setTextColor(5, 150, 105);
    doc.text(formatRupiah(totalCredit), totalCreditX, y + 4.3, { align: 'right' });

    // Final Balance
    const finalBalanceX = totalCreditX + colW.balance;
    doc.setTextColor(6, 78, 59);
    doc.text(formatRupiah(totalBalance), finalBalanceX, y + 4.3, { align: 'right' });

    y += 10;
  }

  // -------------------------------------------------------------
  // Signatures & Sharia Verification Notice
  // -------------------------------------------------------------
  // If not enough space for signature block, add new page
  if (y > pageHeight - 45) {
    doc.addPage();
    y = 16;
    drawPageHeader(false);
  }

  y += 4;
  const sigBoxWidth = (contentWidth - 20) / 2;
  const sig1X = margin + 10;
  const sig2X = margin + contentWidth - sigBoxWidth - 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Nasabah / Pemilik Rekening,', sig1X + sigBoxWidth / 2, y, { align: 'center' });
  doc.text('Teller / Kasir Syariah Pengesah,', sig2X + sigBoxWidth / 2, y, { align: 'center' });

  y += 18;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(member.fullName, sig1X + sigBoxWidth / 2, y, { align: 'center' });
  doc.text(tellerName, sig2X + sigBoxWidth / 2, y, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`No. Anggota: ${member.memberNumber}`, sig1X + sigBoxWidth / 2, y + 3.5, { align: 'center' });
  doc.text('Bagian Kasir & Teller Syariah', sig2X + sigBoxWidth / 2, y + 3.5, { align: 'center' });

  y += 10;

  // Official Seal / Footnote
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 9, 1, 1, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Catatan: Buku tabungan & mutasi ini dicetak melalui SIMPANANKU.',
    pageWidth / 2,
    y + 4,
    { align: 'center' }
  );
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(6, 95, 70);
  doc.text(
    `Verifikasi Digital: https://simpananku.my.id • Tanggal Verifikasi: ${printDateStr}`,
    pageWidth / 2,
    y + 7.5,
    { align: 'center' }
  );

  // Save the document with clean filename
  const safeName = member.fullName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Buku_Tabungan_${member.memberNumber}_${safeName}.pdf`;
  doc.save(filename);
}
