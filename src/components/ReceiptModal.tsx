import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Share2, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  QrCode,
  FileText,
  FileDown
} from 'lucide-react';
import { Transaction, Member } from '../types';
import { 
  formatRupiah, 
  formatDateIndo, 
  terbilang, 
  generateWhatsAppMessage, 
  createWhatsAppLink 
} from '../services/generator';
import { generateReceiptPdf } from '../services/receiptPdfService';
import simpanankuLogo from '../assets/images/simpananku.jpg';

interface ReceiptModalProps {
  transaction: Transaction;
  member?: Member | null;
  currentBalance?: number;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  member,
  currentBalance,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'thermal' | 'whatsapp' | 'formal'>('thermal');
  const [customPhone, setCustomPhone] = useState(member?.phone || '');

  const memberName = member?.fullName || transaction.memberName || 'Nasabah';
  const waText = generateWhatsAppMessage(transaction, member, currentBalance);
  const waUrl = createWhatsAppLink(customPhone, waText);

  const handleCopy = () => {
    navigator.clipboard.writeText(waText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const typeLabels: Record<string, string> = {
    setoran: 'SETORAN TABUNGAN SYARIAH',
    penarikan: 'PENARIKAN TABUNGAN SYARIAH',
    gadai_pencairan: 'PENCAIRAN GADAI SYARIAH (RAHN)',
    gadai_tebus: 'PELUNASAN TEBUS GADAI (RAHN)',
    gadai_ujrah: 'PEMBAYARAN BIAYA TITIP GADAI (UJRAH)',
    kredit_pencairan: 'PENYERAHAN PEMBIAYAAN BARANG (MURABAHAH)',
    kredit_angsuran: 'PEMBAYARAN ANGSURAN KREDIT BARANG',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-900 text-white border-b border-emerald-800 no-print">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white p-0.5 overflow-hidden flex items-center justify-center shrink-0 shadow-sm border border-emerald-300/40">
              <img src={simpanankuLogo} alt="Logo Simpananku" className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" />
            </div>
            <div>
              <h3 className="text-base font-bold">Bukti Transaksi Syariah</h3>
              <p className="text-xs text-emerald-200">Ref: {transaction.referenceNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => generateReceiptPdf(transaction, member, currentBalance)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
              title="Cetak dan Unduh File PDF Resmi"
            >
              <FileDown className="w-3.5 h-3.5" />
              Cetak PDF
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2 no-print">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('thermal')}
              className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
                activeTab === 'thermal'
                  ? 'bg-white text-emerald-800 border-t-2 border-emerald-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Struk Kasir (Thermal)
            </button>
            <button
              onClick={() => setActiveTab('formal')}
              className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
                activeTab === 'formal'
                  ? 'bg-white text-emerald-800 border-t-2 border-emerald-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Voucher Formal
            </button>
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
                activeTab === 'whatsapp'
                  ? 'bg-white text-emerald-800 border-t-2 border-emerald-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Share WhatsApp
            </button>
          </div>

          <button
            onClick={() => generateReceiptPdf(transaction, member, currentBalance)}
            className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 pb-2 cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5" />
            Unduh Dokumen PDF
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {activeTab === 'thermal' && (
            <div 
              id="printable-receipt"
              className="bg-white p-6 border-2 border-dashed border-slate-300 rounded-xl shadow-xs font-mono text-xs text-slate-800 max-w-sm mx-auto space-y-3"
            >
              {/* Receipt Header */}
              <div className="text-center pb-2 border-b border-slate-300">
                <div className="w-12 h-12 mx-auto mb-1.5 rounded-xl bg-white p-0.5 shadow-xs border border-slate-200 flex items-center justify-center overflow-hidden">
                  <img 
                    src={simpanankuLogo} 
                    alt="Logo Simpananku" 
                    className="w-full h-full object-cover rounded-lg"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="font-bold text-sm tracking-wider text-slate-950 font-sans">
                  SIMPANANKU
                </div>
                <div className="text-[10px] text-slate-600 font-medium">
                  Simpanan Tabungan • Gadai Syariah (Rahn) • Kredit Barang (Murabahah)
                </div>
                <div className="text-[10px] text-slate-500">
                  Sistem Informasi khusus anggota SIMPANANKU by. WAROENG HIJI
                </div>
                <div className="text-[10px] text-emerald-700 font-bold mt-1">
                  *** TRANSAKSI RESMI BERKAH ***
                </div>
              </div>

              {/* Meta details */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>No. Ref:</span>
                  <span className="font-bold">{transaction.referenceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal:</span>
                  <span>{formatDateIndo(transaction.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Teller:</span>
                  <span>{transaction.tellerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>No. Anggota:</span>
                  <span className="font-bold text-emerald-800">{transaction.memberNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Nama Nasabah:</span>
                  <span className="font-semibold">{memberName}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-300 pt-2 pb-1">
                <div className="text-center font-bold text-slate-900 text-xs uppercase mb-1">
                  {typeLabels[transaction.type] || transaction.type}
                </div>
                <div className="text-center text-[10px] text-slate-600">
                  Akad: {transaction.akad.toUpperCase()}
                </div>
              </div>

              {/* Amount Box */}
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-center">
                <div className="text-[10px] text-slate-500 uppercase">Jumlah Transaksi</div>
                <div className="text-base font-black text-slate-950">
                  {formatRupiah(transaction.amount)}
                </div>
                <div className="text-[10px] italic text-slate-600 mt-0.5">
                  ({terbilang(transaction.amount)} Rupiah)
                </div>
              </div>

              {currentBalance !== undefined && (
                <div className="flex justify-between text-[11px] pt-1 border-t border-slate-200">
                  <span>Saldo Tabungan:</span>
                  <span className="font-bold text-emerald-800">{formatRupiah(currentBalance)}</span>
                </div>
              )}

              {transaction.notes && (
                <div className="text-[10px] text-slate-600 bg-amber-50 p-2 rounded border border-amber-200">
                  <span className="font-bold">Ket:</span> {transaction.notes}
                </div>
              )}

              {/* QR Code and Footer */}
              <div className="pt-2 border-t border-dashed border-slate-300 text-center space-y-1">
                <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500">
                  <QrCode className="w-4 h-4 text-slate-700" />
                  <span>Kode Verifikasi: {transaction.receiptCode}</span>
                </div>
                <div className="text-[9px] text-slate-400">
                  Terima kasih atas amanah dan muamalah syariah Anda.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'formal' && (
            <div className="bg-white p-6 border border-slate-200 rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-700 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white p-0.5 border border-emerald-300 overflow-hidden shadow-xs shrink-0 flex items-center justify-center">
                    <img 
                      src={simpanankuLogo} 
                      alt="Logo Simpananku" 
                      className="w-full h-full object-cover rounded-lg" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-emerald-950 font-sans">
                      SIMPANANKU
                    </div>
                    <div className="text-xs text-slate-600 font-medium">
                      Simpanan Tabungan • Gadai Syariah (Rahn) • Kredit Barang (Murabahah)
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-900 font-mono text-xs font-bold">
                    VALID / LUNAS
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Nomor Referensi</span>
                  <span className="font-bold text-slate-900 font-mono">{transaction.referenceNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Waktu Transaksi</span>
                  <span className="font-medium text-slate-900">{formatDateIndo(transaction.createdAt)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Nomor Anggota (Pengganti Rekening)</span>
                  <span className="font-bold text-emerald-700 text-sm">{transaction.memberNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Nama Nasabah</span>
                  <span className="font-semibold text-slate-900">{memberName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Jenis Transaksi & Akad</span>
                  <span className="font-medium text-slate-900">
                    {typeLabels[transaction.type]} (Akad {transaction.akad.toUpperCase()})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Metode Pembayaran</span>
                  <span className="font-medium text-slate-900 uppercase">{transaction.paymentMethod}</span>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center">
                <div>
                  <span className="text-xs text-emerald-800 font-medium">TOTAL NOMINAL</span>
                  <div className="text-xs text-emerald-700 italic">
                    {terbilang(transaction.amount)} Rupiah
                  </div>
                </div>
                <div className="text-xl font-black text-emerald-950">
                  {formatRupiah(transaction.amount)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200 text-center text-xs">
                <div>
                  <p className="text-slate-500 mb-10">Penyetor / Nasabah</p>
                  <p className="font-bold text-slate-900 border-t border-slate-300 pt-1 inline-block min-w-[120px]">
                    {memberName}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 mb-10">Teller / Kasir Bertugas</p>
                  <p className="font-bold text-slate-900 border-t border-slate-300 pt-1 inline-block min-w-[120px]">
                    {transaction.tellerName}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'whatsapp' && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-950">
                  <p className="font-semibold">Format Bukti WhatsApp Otomatis</p>
                  <p className="text-emerald-700 mt-0.5">
                    Pesan terformat rapi dengan rincian nomor anggota, nominal, akad syariah, dan tautan verifikasi.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor WhatsApp Nasabah:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    placeholder="0812xxxxxxxx"
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono"
                  />
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Kirim WA
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Preview Pesan WhatsApp:
                  </label>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900 font-semibold"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Tersalin ke Clipboard!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Salin Pesan
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={10}
                  value={waText}
                  className="w-full p-3 bg-slate-900 text-emerald-300 font-mono text-[11px] rounded-xl border border-slate-800 resize-none leading-relaxed"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 no-print">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => generateReceiptPdf(transaction, member, currentBalance)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              Cetak PDF (Dokumen Resmi)
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Struk
            </button>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              Kirim WA
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
