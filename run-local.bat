@echo off
REM ==============================================================================
REM SIMPANANKU - Script Otomatis Menjalankan Proyek di Windows (CMD / PowerShell)
REM ==============================================================================

echo --------------------------------------------------------
echo   MEMULAI SISTEM SIMPANANKU (Frontend React + Laravel 13)
echo --------------------------------------------------------

REM 1. Cek Folder Storage & Cache Laravel
cd backend-laravel
if not exist "bootstrap\cache" mkdir "bootstrap\cache"
if not exist "storage\app\public" mkdir "storage\app\public"
if not exist "storage\framework\cache\data" mkdir "storage\framework\cache\data"
if not exist "storage\framework\sessions" mkdir "storage\framework\sessions"
if not exist "storage\framework\views" mkdir "storage\framework\views"
if not exist "storage\logs" mkdir "storage\logs"

REM 2. Cek .env
if not exist ".env" (
    echo [INFO] Menyalin .env.example ke .env...
    copy .env.example .env
    call php artisan key:generate
)

REM 3. Install composer jika vendor belum ada
if not exist "vendor" (
    echo [INFO] Memasang dependensi Composer...
    call composer install
)

REM 4. Jalankan backend di window terpisah
echo [INFO] Menjalankan Laravel API Server di port 8000...
start "SIMPANANKU Backend API (Port 8000)" cmd /k "php artisan serve --port=8000"

REM 5. Kembali ke root dan jalankan Frontend
cd ..
if not exist "node_modules" (
    echo [INFO] Memasang dependensi Node.js...
    call npm install
)

echo [INFO] Menjalankan Frontend React Vite di port 3000...
echo Silakan buka browser di: http://localhost:3000
npm run dev -- --port 3000

pause
