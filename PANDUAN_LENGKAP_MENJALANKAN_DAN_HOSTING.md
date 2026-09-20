# 📚 PANDUAN LENGKAP EKSEKUSI & DEPLOYMENT SISTEM SIMPANANKU

> Panduan terkini untuk setup lokal dan deployment ada di [DEPLOYMENT.md](DEPLOYMENT.md). Ikuti panduan tersebut untuk konfigurasi session, database, migrasi, dan akun admin awal.
### Sistem Pengelolaan Simpanan Tabungan, Gadai Syariah (Rahn), & Kredit Barang (Murabahah)
Arsitektur: **Modern Frontend (React 19 + Vite + Tailwind)** & **Backend API (Laravel 13 AI-Native)**

---

## 📋 DAFTAR ISI
1. [Arsitektur & Spesifikasi Sistem](#1-arsitektur--spesifikasi-sistem)
2. [Menjalankan di Komputer Lokal (Localhost)](#2-menjalankan-di-komputer-lokal-localhost)
   - [Metode A: Skrip Otomatis (Paling Cepat)](#metode-a-skrip-otomatis-paling-cepat)
   - [Metode B: Manual Step-by-Step (Linux / macOS / Windows)](#metode-b-manual-step-by-step)
   - [Metode C: Docker Compose](#metode-c-docker-compose)
   - [Metode D: Laragon / XAMPP di Windows](#metode-d-laragon--xampp-di-windows)
3. [Panduan Deployment ke Hosting cPanel / Shared Hosting](#3-panduan-deployment-ke-hosting-cpanel--shared-hosting)
   - [Pola Rekomendasi: Arsitektur Subdomain](#pola-rekomendasi-arsitektur-subdomain)
   - [Langkah 1: Setup Basis Data MySQL di cPanel](#langkah-1-setup-basis-data-mysql-di-cpanel)
   - [Langkah 2: Unggah & Konfigurasi Backend Laravel](#langkah-2-unggah--konfigurasi-backend-laravel)
   - [Langkah 3: Build & Unggah Frontend React](#langkah-3-build--unggah-frontend-react)
   - [Langkah 4: Konfigurasi CORS & Uji Coba](#langkah-4-konfigurasi-cors--uji-coba)
4. [Panduan Deployment ke VPS (Ubuntu / Debian / Nginx)](#4-panduan-deployment-ke-vps-ubuntu--debian--nginx)
   - [Langkah 1: Instalasi Paket & Ekstensi PHP 8.2](#langkah-1-instalasi-paket--ekstensi-php-82)
   - [Langkah 2: Clone & Konfigurasi Izin Akses File](#langkah-2-clone--konfigurasi-izin-akses-file)
   - [Langkah 3: Konfigurasi Nginx Reverse Proxy](#langkah-3-konfigurasi-nginx-reverse-proxy)
   - [Langkah 4: Amankan dengan SSL Let's Encrypt (Certbot)](#langkah-4-amankan-dengan-ssl-lets-encrypt-certbot)
5. [Tabel Akun Pengguna Uji Coba (Demo Credentials)](#5-tabel-akun-pengguna-uji-coba-demo-credentials)
6. [Troubleshooting & Solusi Kendala Umum](#6-troubleshooting--solusi-kendala-umum)

---

## 1. Arsitektur & Spesifikasi Sistem

Sistem **SIMPANANKU** dibangun dengan pemisahan tugas (*separation of concerns*) yang bersih:
- **Frontend SPA (Single Page Application)**:
  - Berada di root direktori `/src`
  - Dibangun dengan **React 19**, **Vite**, **Tailwind CSS**, Lucide Icons, dan jsPDF untuk mutasi buku tabungan & kwitansi.
  - Komunikasi data via RESTful API (`ApiClient` di `src/services/api.ts`).
- **Backend API Server**:
  - Berada di subfolder `/backend-laravel`
  - Menggunakan **Laravel 13**, **PHP 8.2+**, **Laravel Sanctum** (otentikasi token Bearer), dan integrasi AI-Native untuk audit syariah DSN-MUI & taksiran marhun gadai.

```
📁 Root Proyek/
├── 📁 backend-laravel/          -> Source Code Backend API Laravel 13
│   ├── 📁 app/Http/Controllers/Api/
│   ├── 📁 database/migrations/
│   ├── 📁 routes/api.php
│   ├── 📄 .env.example
│   ├── 📄 composer.json
│   └── 📄 Dockerfile
├── 📁 src/                     -> Source Code Frontend React
├── 📄 docker-compose.yml       -> Orkestrasi Docker (MySQL, Backend, Frontend)
├── 📄 run-local.sh             -> Skrip Eksekusi Otomatis Linux/macOS
├── 📄 run-local.bat            -> Skrip Eksekusi Otomatis Windows
├── 📄 nginx/default.conf       -> Konfigurasi Nginx Server
└── 📄 package.json             -> Konfigurasi Frontend Vite
```

---

## 2. Menjalankan di Komputer Lokal (Localhost)

### Prasyarat:
- **PHP**: Versi >= 8.2 (dengan ekstensi `pdo_mysql`, `mbstring`, `openssl`, `curl`, `gd`, `zip`)
- **Composer**: Versi 2.x
- **Node.js**: Versi 18.x atau 20.x (LTS) & NPM
- **MySQL / MariaDB** (atau SQLite)

---

### Metode A: Skrip Otomatis (Paling Cepat)

#### Untuk Linux / macOS / Git Bash / WSL:
1. Buka terminal di direktori root proyek.
2. Berikan izin eksekusi lalu jalankan skrip:
   ```bash
   chmod +x run-local.sh
   ./run-local.sh
   ```
Skrip ini akan secara otomatis:
- Memeriksa instalasi PHP, Composer, dan Node.js.
- Menyiapkan folder `storage` & `bootstrap/cache`.
- Membuat file `.env` dan menghasilkan `APP_KEY`.
- Memasang dependensi Composer dan Node modules.
- Menjalankan backend Laravel pada `http://localhost:8000` dan frontend React pada `http://localhost:3000`.

#### Untuk Windows:
Klik dua kali file `run-local.bat` atau jalankan via Command Prompt:
```cmd
run-local.bat
```

---

### Metode B: Manual Step-by-Step

#### 1. Setup Backend Laravel:
Buka Terminal 1:
```bash
# 1. Masuk ke folder backend
cd backend-laravel

# 2. Buat folder cache dan storage jika belum ada
mkdir -p bootstrap/cache storage/framework/{sessions,views,cache/data} storage/logs storage/app/public
chmod -R 775 storage bootstrap/cache

# 3. Salin file environment
cp .env.example .env

# 4. Pasang dependensi PHP
composer install

# 5. Buat Application Encryption Key
php artisan key:generate

# 6. Konfigurasi Database di file .env:
# Buka file .env dan sesuaikan:
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=simpananku_syariah_db
# DB_USERNAME=root
# DB_PASSWORD=

# 7. Buat database di MySQL Anda:
# mysql -u root -e "CREATE DATABASE IF NOT EXISTS simpananku_syariah_db;"

# 8. Jalankan Migrasi dan Seeder data awal:
php artisan migrate:fresh --seed

# 9. Jalankan Server API Laravel:
php artisan serve --port=8000
```
API Backend akan aktif di: `http://localhost:8000/api/v1`

#### 2. Setup Frontend React:
Buka Terminal 2 di folder root proyek:
```bash
# 1. Buat file .env dari template
cp .env.local.example .env

# Pastikan isi file .env adalah:
# VITE_API_URL=http://localhost:8000/api/v1

# 2. Pasang dependensi Node.js
npm install

# 3. Jalankan server frontend Vite
npm run dev -- --port 3000
```
Buka browser Anda dan akses: `http://localhost:3000`

---

### Metode C: Docker Compose
Jika Anda memiliki **Docker** dan **Docker Compose** terpasang di komputer:
```bash
# Jalankan seluruh stack (MariaDB + Laravel API + React Vite):
docker compose up -d

# Jalankan migrasi dan seeder di dalam container backend:
docker compose exec backend php artisan migrate --seed
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000/api/v1`
- Database MariaDB: `localhost:3306`

---

### Metode D: Laragon / XAMPP di Windows

1. **Pengguna Laragon**:
   - Pindahkan folder proyek ke `C:\laragon\www\simpananku`.
   - Buka Laragon, klik **Start All** (Apache/Nginx & MySQL).
   - Buka Laragon Terminal (klik tombol `Terminal`).
   - Masuk ke `cd backend-laravel`, jalankan `composer install`, `php artisan key:generate`, dan `php artisan migrate --seed`.
   - Kembali ke root `cd ..`, jalankan `npm install` dan `npm run dev`.

2. **Pengguna XAMPP**:
   - Buka XAMPP Control Panel, aktifkan modul **Apache** dan **MySQL**.
   - Buka `http://localhost/phpmyadmin`, buat database baru bernama `simpananku_syariah_db` dengan collation `utf8mb4_unicode_ci`.
   - Ikuti langkah pada **Metode B (Manual Step-by-Step)**.

---

## 3. Panduan Deployment ke Hosting cPanel / Shared Hosting

Untuk performa, keamanan, dan kemudahan manajemen, arsitektur yang sangat direkomendasikan adalah **Arsitektur Dua Subdomain**:
- **Frontend SPA**: `app.domainanda.com` (atau `simpananku.domainanda.com`)
- **Backend Laravel API**: `api.domainanda.com`

---

### Langkah 1: Setup Basis Data MySQL di cPanel
1. Masuk ke cPanel hosting Anda.
2. Buka menu **MySQL Database Wizard**.
3. Buat database baru: contoh `u1234567_simpananku`.
4. Buat pengguna database baru: contoh `u1234567_smpuser`, masukkan kata sandi yang aman.
5. Berikan hak akses penuh (**ALL PRIVILEGES**) kepada user tersebut ke database yang dibuat.
6. Simpan detail nama database, user, dan password.

---

### Langkah 2: Unggah & Konfigurasi Backend Laravel

1. **Kompresi file backend**:
   Di komputer lokal Anda, buat file zip dari isi folder `backend-laravel` (lewati folder `vendor` dan `node_modules` agar ukuran zip kecil).
2. **Unggah ke cPanel**:
   - Buka **File Manager** cPanel.
   - Buka direktori root akun hosting Anda: `/home/username/` (di luar folder `public_html` demi alasan keamanan).
   - Buat folder baru bernama `backend-laravel`.
   - Unggah file zip tadi ke `/home/username/backend-laravel/` lalu ekstrak.
3. **Buat Subdomain API**:
   - Buka menu **Domains** / **Subdomains** di cPanel.
   - Buat subdomain baru: `api.domainanda.com`.
   - Arahkan **Document Root** subdomain tersebut ke:
     `/home/username/backend-laravel/public`
     *(PENTING: Harus mengarah ke subfolder `/public`, bukan root folder Laravel!)*
4. **Konfigurasi file `.env`**:
   - Di dalam `/home/username/backend-laravel/`, buat atau edit file `.env`.
   - Sesuaikan konfigurasi berikut:
     ```ini
     APP_NAME=SIMPANANKU
     APP_ENV=production
     APP_KEY=base64:SALIN_KEY_DARI_LOKAL_ANDA_DISINI
     APP_DEBUG=false
     APP_URL=https://api.domainanda.com

     DB_CONNECTION=mysql
     DB_HOST=localhost
     DB_PORT=3306
     DB_DATABASE=u1234567_simpananku
     DB_USERNAME=u1234567_smpuser
     DB_PASSWORD=Password_Kuat_Anda

     # Izinkan domain frontend mengakses API (CORS)
     CORS_ALLOWED_ORIGINS="https://app.domainanda.com,https://domainanda.com"
     ```
5. **Install Vendor & Migrasi Database**:
   - Jika hosting Anda memiliki akses **SSH / Terminal**:
     ```bash
     cd /home/username/backend-laravel
     composer install --optimize-autoloader --no-dev
     php artisan migrate --seed --force
     php artisan config:cache
     php artisan route:cache
     ```
   - Jika **TIDAK** ada akses Terminal di cPanel:
     - Di komputer lokal, jalankan `php artisan migrate --seed` pada database lokal.
     - Ekspor database lokal Anda menjadi file `.sql` via phpMyAdmin / HeidiSQL.
     - Di cPanel phpMyAdmin, buka database hosting dan klik **Import** file `.sql` tersebut.
     - Unggah folder `vendor` dari lokal ke server.

---

### Langkah 3: Build & Unggah Frontend React

1. **Konfigurasi URL API Produksi**:
   Di komputer lokal Anda, buka file `.env` (atau buat `.env.production`) di folder root frontend:
   ```ini
   VITE_API_URL=https://api.domainanda.com/api/v1
   ```
2. **Kompilasi Frontend (Build)**:
   Jalankan perintah kompilasi:
   ```bash
   npm run build
   ```
   Perintah ini akan menghasilkan folder `/dist` yang berisi file HTML, JS, dan CSS statis yang sangat teroptimasi dan ringan.
3. **Unggah Hasil Build ke Hosting**:
   - Buka File Manager cPanel.
   - Buka Document Root untuk domain frontend Anda (misal `public_html` atau Document Root untuk `app.domainanda.com`).
   - Unggah seluruh isi file yang berada di dalam folder `dist/` lokal ke dalam folder tersebut.
4. **Konfigurasi `.htaccess` untuk SPA (Single Page Application)**:
   Pastikan terdapat file `.htaccess` di Document Root frontend Anda agar saat pengguna melakukan refresh halaman tidak terjadi error 404:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

---

### Langkah 4: Konfigurasi CORS & Uji Coba

1. Pastikan SSL/HTTPS telah aktif pada kedua domain (`https://app.domainanda.com` dan `https://api.domainanda.com`). Anda dapat mengaktifkan **Let's Encrypt** gratis via menu **SSL/TLS Status** di cPanel.
2. Buka `https://app.domainanda.com` di browser Anda.
3. Coba login dengan kredensial Administrator atau Teller (lihat tabel di bawah).
4. Lakukan pendaftaran anggota baru, transaksi setor/tarik, dan uji cetak kwitansi serta mutasi buku tabungan!

---

## 4. Panduan Deployment ke VPS (Ubuntu / Debian / Nginx)

Jika Anda menggunakan VPS (seperti DigitalOcean Droplet, AWS EC2, Linode, atau Hetzner):

### Langkah 1: Instalasi Paket & Ekstensi PHP 8.2
```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Install Nginx, MariaDB, Git, Unzip
sudo apt install -y nginx mariadb-server git unzip curl

# Pasang repositori PHP Ondrej PPA
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update

# Pasang PHP 8.2 & ekstensi pendukung
sudo apt install -y php8.2 php8.2-fpm php8.2-mysql php8.2-mbstring \
php8.2-xml php8.2-curl php8.2-gd php8.2-zip php8.2-bcmath php8.2-intl

# Pasang Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Pasang Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

---

### Langkah 2: Clone & Konfigurasi Izin Akses File

```bash
# Clone proyek ke /var/www/simpananku
sudo git clone https://github.com/akun-anda/simpananku.git /var/www/simpananku
cd /var/www/simpananku

# 1. Setup Backend
cd backend-laravel
cp .env.example .env
composer install --no-dev --optimize-autoloader
php artisan key:generate

# Konfigurasi basis data di .env (sesuai MariaDB VPS Anda)
nano .env

# Jalankan migrasi
php artisan migrate --seed --force
php artisan config:cache
php artisan route:cache

# Berikan hak akses kepada web server (www-data)
sudo chown -R www-data:www-data /var/www/simpananku/backend-laravel/storage /var/www/simpananku/backend-laravel/bootstrap/cache
sudo chmod -R 775 /var/www/simpananku/backend-laravel/storage /var/www/simpananku/backend-laravel/bootstrap/cache

# 2. Build Frontend
cd /var/www/simpananku
echo "VITE_API_URL=https://domainanda.com/api/v1" > .env.production
npm install
npm run build
```

---

### Langkah 3: Konfigurasi Nginx Reverse Proxy

Buat file konfigurasi Nginx baru:
```bash
sudo nano /etc/nginx/sites-available/simpananku
```

Isi dengan konfigurasi berikut:
```nginx
server {
    listen 80;
    server_name domainanda.com www.domainanda.com;

    # Direktori frontend hasil build
    root /var/www/simpananku/dist;
    index index.html;

    client_max_body_size 64M;

    # 1. Frontend React SPA Routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 2. Backend Laravel 13 API Routing
    location ^~ /api {
        alias /var/www/simpananku/backend-laravel/public;
        try_files $uri $uri/ @laravel;

        location ~ \.php$ {
            fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
            fastcgi_param SCRIPT_FILENAME /var/www/simpananku/backend-laravel/public/index.php;
            include fastcgi_params;
        }
    }

    location @laravel {
        rewrite /api/(.*)$ /api/$1 last;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

Aktifkan konfigurasi dan restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/simpananku /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### Langkah 4: Amankan dengan SSL Let's Encrypt (Certbot)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d domainanda.com -d www.domainanda.com
```
Certbot akan secara otomatis memperbarui file Nginx Anda dan mengonfigurasi sertifikat HTTPS SSL yang aktif dan diperbarui otomatis setiap 90 hari.

---

## 5. Tabel Akun Pengguna Uji Coba (Demo Credentials)

Hasil eksekusi `php artisan migrate --seed` menyediakan 5 akun siap uji:

| Peran Sistem | Akun / Email Login | Kata Sandi | ID / Nomor Anggota | Fitur Utama yang Dapat Diakses |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | `admin@simpananku.my.id` | `admin123` | - | Manajemen master produk simpanan syariah, pengawasan audit DSN-MUI, laporan statistik menyeluruh |
| **Teller Kasir** | `teller@simpananku.my.id` | `teller123` | - | Registrasi Anggota (AG0001 dst), Setor/Tarik tabungan, Pencairan Gadai Rahn, Kredit Barang Murabahah, Cetak Kwitansi & Buku Tabungan |
| **Nasabah 1** | `nasabah@simpananku.my.id` | `nasabah123` | `AG0001` | Dashboard nasabah mandiri, mutasi tabungan wadiah & mudharabah, status 1 akad Rahn aktif, status 1 cicilan Murabahah |
| **Nasabah 2** | `khadijah@simpananku.my.id` | `nasabah123` | `AG0002` | Tabungan Wadiah & Tabungan Qurban/Haji |
| **Nasabah 3** | `bambang@gmail.com` | `nasabah123` | `AG0003` | Tabungan Sukarela Wadiah |

*Catatan: Anda juga dapat mendaftar sebagai anggota baru melalui menu Teller/Admin. Nomor anggota otomatis mengikuti format **AG0004**, **AG0005**, dst.*

---

## 6. Troubleshooting & Solusi Kendala Umum

### 1. Error `500 Internal Server Error` saat pertama kali akses API
- **Penyebab**: Folder storage belum memiliki hak tulis (permission) atau `APP_KEY` belum terbuat.
- **Solusi**:
  ```bash
  cd backend-laravel
  php artisan key:generate
  chmod -R 775 storage bootstrap/cache
  chown -R www-data:www-data storage bootstrap/cache  # jika di Linux/VPS
  ```

### 2. Error `CORS Missing Allow Origin` di Browser Console
- **Penyebab**: Backend Laravel menolak permintaan HTTP karena asal URL frontend belum terdaftar di whitelist CORS.
- **Solusi**: Buka `backend-laravel/.env`, sesuaikan baris `CORS_ALLOWED_ORIGINS`:
  ```ini
  CORS_ALLOWED_ORIGINS="http://localhost:3000,https://app.domainanda.com,https://domainanda.com"
  ```
  Lalu jalankan `php artisan config:clear`.

### 3. Halaman Frontend 404 saat di-Refresh di Browser
- **Penyebab**: Server web (Nginx/Apache) mencari file fisik di disk sesuai URL alih-alih mengoper rute ke `index.html`.
- **Solusi**:
  - Pada **Apache/cPanel**: Pastikan file `.htaccess` berisi baris `RewriteRule . /index.html [L]` sudah terunggah di folder frontend.
  - Pada **Nginx**: Pastikan blok `location /` memiliki aturan `try_files $uri $uri/ /index.html;`.

### 4. Ekstensi PHP Belum Lengkap
- Jika muncul pesan `Class 'PDO' not found` atau `Call to undefined function mb_detect_encoding()`:
  - Buka file `php.ini` Anda (di cPanel via menu **Select PHP Version** -> **Extensions**).
  - Pastikan ekstensi berikut dicentang/diaktifkan: `pdo_mysql`, `mbstring`, `openssl`, `curl`, `gd`, `zip`, `bcmath`, `fileinfo`.

---

✨ **SIMPANANKU** siap dijalankan dengan stabil dan aman baik di komputer lokal maupun di server hosting/VPS produksi!
