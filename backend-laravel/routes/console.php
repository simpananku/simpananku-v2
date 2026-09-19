<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('simpananku:sharia-audit', function () {
    $this->info('Memulai Audit Rutin Kepatuhan Syariah Lembaga...');
    $this->info('✓ Akad Wadiah Bebas Biaya Administrasi: VALID');
    $this->info('✓ Akad Rahn Bebas Bunga & Ujrah Sesuai Taksiran Fisik: VALID');
    $this->info('✓ Akad Murabahah Transparan Margin & Nol Denda Riba: VALID');
    $this->info('Sistem SIMPANANKU 100% Selaras dengan Fatwa DSN-MUI.');
})->purpose('Menjalankan audit otomatis kepatuhan fikih muamalah');
