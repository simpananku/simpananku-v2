<?php

namespace App\Services;

class ShariaValidationService
{
    /**
     * Memvalidasi keabsahan Akad Wadiah (Yad Dhamanah).
     */
    public function validateWadiah(float $adminFee, float $initialDeposit): array
    {
        $errors = [];
        if ($adminFee > 0) {
            $errors[] = 'Prinsip Wadiah Syariah murni tidak membebankan biaya administrasi berkala yang menggerus pokok simpanan.';
        }
        if ($initialDeposit < 10000) {
            $errors[] = 'Setoran awal minimal adalah Rp 10.000 untuk pembukaan rekening titipan wadiah.';
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'fatwa_dsn_mui' => 'Fatwa DSN-MUI No. 02/DSN-MUI/IV/2000 tentang Tabungan Wadiah',
        ];
    }

    /**
     * Memvalidasi keabsahan Akad Rahn (Gadai Syariah).
     * Kaidah: Biaya ujrah dihitung atas pemeliharaan/taksiran marhun, BUKAN dari nominal pinjaman.
     */
    public function validateRahn(float $estimatedValue, float $loanAmount, float $ujrahMonthly): array
    {
        $errors = [];
        $maxLoanAllowed = $estimatedValue * 0.85; // Maksimal pinjaman 85% taksiran

        if ($loanAmount > $maxLoanAllowed) {
            $errors[] = "Uang pinjaman (Rp " . number_format($loanAmount, 0, ',', '.') . ") melebihi batas maksimal 85% taksiran marhun (Rp " . number_format($maxLoanAllowed, 0, ',', '.') . ").";
        }

        // Ujrah harus wajar dan bersandar pada biaya pemeliharaan/tempat titipan
        if ($ujrahMonthly <= 0) {
            $errors[] = "Biaya ujrah jasa simpan harus bernilai positif dan transparan.";
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'fatwa_dsn_mui' => 'Fatwa DSN-MUI No. 25/DSN-MUI/III/2002 tentang Rahn dan No. 26/DSN-MUI/III/2002 tentang Rahn Emas',
        ];
    }

    /**
     * Memvalidasi Akad Murabahah (Jual Beli Kredit Komoditas/Barang).
     */
    public function validateMurabahah(float $costPrice, float $downPayment, float $marginAmount, int $tenorMonths): array
    {
        $errors = [];
        if ($costPrice <= 0) {
            $errors[] = "Harga beli pokok barang harus jelas dan riil (ma'lum).";
        }
        if ($marginAmount < 0) {
            $errors[] = "Margin keuntungan penjual tidak boleh bernilai negatif.";
        }
        if ($tenorMonths < 1 || $tenorMonths > 60) {
            $errors[] = "Tenor cicilan harus antara 1 sampai 60 bulan.";
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'fatwa_dsn_mui' => 'Fatwa DSN-MUI No. 04/DSN-MUI/IV/2000 tentang Murabahah',
        ];
    }
}
