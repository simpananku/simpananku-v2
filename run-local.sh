#!/usr/bin/env bash

# ==============================================================================
# SIMPANANKU - Script Otomatis Menjalankan Proyek di Lingkungan Lokal
# Sistem Pengelolaan Simpanan Tabungan, Gadai Syariah, & Kredit Barang
# ==============================================================================

set -e

echo "--------------------------------------------------------"
echo "  MEMULAI SISTEM SIMPANANKU (Frontend React + Laravel 13)"
echo "--------------------------------------------------------"

# 1. Cek Ketersediaan PHP & Node.js
command -v php >/dev/null 2>&1 || { echo "❌ PHP belum terpasang. Harap pasang PHP 8.2+ terlebih dahulu."; exit 1; }
command -v composer >/dev/null 2>&1 || { echo "❌ Composer belum terpasang. Harap pasang Composer terlebih dahulu."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js belum terpasang. Harap pasang Node.js 18+ terlebih dahulu."; exit 1; }

echo "✅ Lingkungan terdeteksi: PHP $(php -v | head -n 1 | cut -d ' ' -f 2), Node $(node -v)"

# 2. Persiapan Backend Laravel
echo ""
echo "📦 [1/4] Menyiapkan Backend Laravel 13..."
cd backend-laravel

# Buat direktori cache & storage jika belum ada
mkdir -p bootstrap/cache storage/framework/{sessions,views,cache/data} storage/logs storage/app/public
chmod -R 775 storage bootstrap/cache 2>/dev/null || true

# Salin .env jika belum ada
if [ ! -f .env ]; then
    echo "📄 Menyalin .env.example ke .env..."
    cp .env.example .env
fi

# Pasang dependensi composer jika folder vendor belum ada
if [ ! -d vendor ]; then
    echo "📥 Mengunduh dependensi Composer..."
    composer install --no-interaction
fi

# Generate APP_KEY jika belum ada
if ! grep -q "APP_KEY=base64:" .env; then
    echo "🔑 Menghasilkan APP_KEY Laravel..."
    php artisan key:generate
fi

echo "🔄 Menjalankan migrasi & seeder awal (opsional)..."
# Menggunakan SQLite sebagai fallback cepat jika MySQL belum diaktifkan
read -p "Apakah Anda ingin menjalankan migrasi sekarang? (y/n): " RUN_MIGRATE
if [ "$RUN_MIGRATE" = "y" ] || [ "$RUN_MIGRATE" = "Y" ]; then
    php artisan migrate --seed
fi

# 3. Kembali ke root dan siapkan Frontend React
cd ..
echo ""
echo "📦 [2/4] Menyiapkan Frontend React..."
if [ ! -d node_modules ]; then
    echo "📥 Mengunduh dependensi Node.js..."
    npm install
fi

# 4. Menjalankan Server
echo ""
echo "🚀 [3/4] Menjalankan Backend Laravel pada port 8000..."
(cd backend-laravel && php artisan serve --host=127.0.0.1 --port=8000) &
LARAVEL_PID=$!

echo "🚀 [4/4] Menjalankan Frontend React Vite pada port 3000..."
echo "Aplikasi siap diakses di: http://localhost:3000"
echo "API Backend aktif di:   http://127.0.0.1:8000/api/v1"
echo "Tekan CTRL + C untuk menghentikan seluruh layanan."

trap "kill $LARAVEL_PID 2>/dev/null; exit" INT TERM EXIT

npm run dev -- --host 0.0.0.0 --port 3000
