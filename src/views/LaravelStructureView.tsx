import React, { useState } from 'react';
import { 
  FolderTree, 
  Copy, 
  Check, 
  FileCode, 
  Terminal, 
  CheckCircle2, 
  Server, 
  Cloud, 
  Box, 
  Key, 
  AlertTriangle, 
  BookOpen, 
  Layers,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { LARAVEL_13_FILES, LaravelFile } from '../data/laravel13Code';

export const LaravelStructureView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'guide' | 'code'>('guide');
  const [guideCategory, setGuideCategory] = useState<'local' | 'cpanel' | 'vps' | 'docker' | 'demo' | 'troubleshoot'>('local');
  const [selectedFile, setSelectedFile] = useState<LaravelFile>(LARAVEL_13_FILES[0]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const categories = Array.from(new Set(LARAVEL_13_FILES.map((f) => f.category)));

  return (
    <div className="space-y-6">
      {/* Top Banner with Navigation Switcher */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-black text-slate-900 font-sans tracking-tight">
              Panduan Eksekusi & Arsitektur Laravel 13
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              Frontend React + Backend Laravel 13 AI-Native
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Panduan lengkap langkah-demi-langkah menjalankan sistem di Lokal (CMD/Bash/Laragon), Hosting cPanel, VPS Nginx, & Docker.
          </p>
        </div>

        {/* View Switcher: Guide vs Code */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'guide'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Panduan Langkah Lengkap
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'code'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            Penjelajah Kode Sumber ({LARAVEL_13_FILES.length})
          </button>
        </div>
      </div>

      {activeTab === 'guide' ? (
        /* GUIDES VIEW */
        <div className="space-y-6">
          {/* Sub-Navigation for Deployment Guides */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
            {[
              { id: 'local', label: '1. Komputer Lokal (Localhost)', icon: Terminal },
              { id: 'cpanel', label: '2. Hosting cPanel (Shared)', icon: Server },
              { id: 'vps', label: '3. Server VPS (Ubuntu & Nginx)', icon: Cloud },
              { id: 'docker', label: '4. Docker Compose Multi-Service', icon: Box },
              { id: 'demo', label: '5. Akun Uji Coba & Seeder', icon: Key },
              { id: 'troubleshoot', label: '6. Troubleshooting & Solusi', icon: AlertTriangle },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = guideCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setGuideCategory(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB 1: LOCALHOST */}
          {guideCategory === 'local' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Method 1: Automated Script */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                        A
                      </span>
                      <h3 className="font-bold text-slate-900 text-base">Metode Skrip Otomatis (1-Klik)</h3>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                      Paling Direkomendasikan
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Kami telah menyertakan skrip otomatis <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono">run-local.sh</code> (Linux/Mac/WSL) dan <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono">run-local.bat</code> (Windows). Skrip ini otomatis mengecek folder cache/storage, membuat file <code className="font-mono">.env</code>, menjalankan key generator, composer, migrasi seeder, dan mem-boot kedua server sekaligus.
                  </p>

                  <div className="space-y-3">
                    <div className="p-4 bg-slate-950 rounded-xl text-xs font-mono text-slate-200 border border-slate-800 relative">
                      <button
                        onClick={() => handleCopy('chmod +x run-local.sh && ./run-local.sh', 'local-sh')}
                        className="absolute right-3 top-3 p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition-colors"
                        title="Salin perintah"
                      >
                        {copiedId === 'local-sh' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <div className="text-slate-500 mb-1"># Di Linux / macOS / Git Bash / WSL:</div>
                      <div className="text-emerald-400 font-bold">chmod +x run-local.sh && ./run-local.sh</div>
                    </div>

                    <div className="p-4 bg-slate-950 rounded-xl text-xs font-mono text-slate-200 border border-slate-800 relative">
                      <button
                        onClick={() => handleCopy('run-local.bat', 'local-bat')}
                        className="absolute right-3 top-3 p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition-colors"
                        title="Salin perintah"
                      >
                        {copiedId === 'local-bat' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <div className="text-slate-500 mb-1"># Di Windows Command Prompt / PowerShell:</div>
                      <div className="text-amber-300 font-bold">run-local.bat</div>
                    </div>
                  </div>
                </div>

                {/* Method 2: Manual Step-by-Step */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs">
                      B
                    </span>
                    <h3 className="font-bold text-slate-900 text-base">Metode Manual Dua Terminal</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
                        <span>Terminal 1: Setup & Jalankan Backend Laravel 13</span>
                        <button
                          onClick={() => handleCopy(`cd backend-laravel
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve --port=8000`, 't1')}
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:underline"
                        >
                          {copiedId === 't1' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          Salin Seluruh Perintah
                        </button>
                      </div>
                      <div className="p-4 bg-slate-950 rounded-xl text-xs font-mono text-emerald-300 border border-slate-800 space-y-1">
                        <div className="text-slate-500"># 1. Masuk folder backend</div>
                        <div>cd backend-laravel</div>
                        <div className="text-slate-500 mt-2"># 2. Salin environment & install paket</div>
                        <div>cp .env.example .env</div>
                        <div>composer install</div>
                        <div>php artisan key:generate</div>
                        <div className="text-slate-500 mt-2"># 3. Jalankan migrasi tabel syariah & seeder akun</div>
                        <div>php artisan migrate --seed</div>
                        <div className="text-slate-500 mt-2"># 4. Aktifkan server API pada port 8000</div>
                        <div className="text-white font-bold">php artisan serve --port=8000</div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
                        <span>Terminal 2: Jalankan Frontend React (Vite)</span>
                        <button
                          onClick={() => handleCopy(`npm install
npm run dev -- --port 3000`, 't2')}
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:underline"
                        >
                          {copiedId === 't2' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          Salin Perintah
                        </button>
                      </div>
                      <div className="p-4 bg-slate-950 rounded-xl text-xs font-mono text-amber-300 border border-slate-800 space-y-1">
                        <div className="text-slate-500"># Di root direktori proyek:</div>
                        <div>npm install</div>
                        <div className="text-white font-bold">npm run dev -- --port 3000</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar Info & Requirements */}
              <div className="space-y-6">
                <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-4">
                  <h4 className="font-bold text-sm text-amber-400 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Prasyarat Sistem Lokal
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>PHP &gt;= 8.2</strong> (ekstensi: pdo_mysql, mbstring, openssl, curl, gd, zip)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Composer 2.x</strong> untuk dependensi Laravel</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Node.js 18+ / 20+</strong> & NPM</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>MySQL 8.0+ / MariaDB</strong> (default port 3306) atau Laragon / XAMPP</span>
                    </li>
                  </ul>

                  <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-[11px] text-slate-300 space-y-1">
                    <div className="text-amber-300 font-bold">URL Akses Lokal:</div>
                    <div>Frontend UI: <code className="text-white font-mono">http://localhost:3000</code></div>
                    <div>Backend API: <code className="text-white font-mono">http://localhost:8000/api/v1</code></div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-2">
                  <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Catatan Laragon & XAMPP
                  </h4>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Jika menggunakan Laragon, cukup letakkan folder di <code className="font-mono bg-amber-100/80 px-1 rounded">C:\laragon\www\simpananku</code>. Di phpMyAdmin, buat database bernama <code className="font-mono bg-amber-100/80 px-1 rounded">simpananku_syariah_db</code> sebelum menjalankan migrasi.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CPANEL HOSTING */}
          {guideCategory === 'cpanel' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-emerald-700" />
                  <h3 className="font-bold text-slate-900 text-base">Panduan Deployment ke cPanel / Shared Hosting</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Untuk shared hosting cPanel, arsitektur terbaik dan paling aman adalah membagi ke dalam <strong>dua subdomain</strong>: <br />
                  1. <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-emerald-800 font-bold">api.domainanda.com</code> untuk Backend Laravel 13 <br />
                  2. <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-blue-800 font-bold">app.domainanda.com</code> (atau domain utama) untuk Frontend React Vite.
                </p>

                {/* Step List */}
                <div className="space-y-4 pt-2">
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                      <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px]">1</span>
                      Setup Database MySQL di cPanel
                    </div>
                    <p className="text-xs text-slate-600">
                      Buka <strong>cPanel &gt; MySQL Database Wizard</strong>. Buat database (contoh: <code className="font-mono text-slate-800">u123_simpananku</code>) dan pengguna database. Berikan hak akses <strong>ALL PRIVILEGES</strong>.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                      <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px]">2</span>
                      Unggah Backend Laravel di Luar public_html (Keamanan Tingkat Tinggi)
                    </div>
                    <p className="text-xs text-slate-600">
                      Di File Manager cPanel, buat folder baru di root direktori akun Anda: <code className="font-mono text-slate-800">/home/username/backend-laravel</code>. Unggah seluruh file folder backend-laravel ke sini (kecuali folder vendor/node_modules).
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                      <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px]">3</span>
                      Buat Subdomain API & Arahkan ke Folder public/
                    </div>
                    <p className="text-xs text-slate-600">
                      Di menu <strong>Subdomains</strong>, buat <code className="font-mono">api.domainanda.com</code> dan set Document Root ke: <br />
                      <strong className="text-emerald-800 font-mono">/home/username/backend-laravel/public</strong> <br />
                      <span className="text-amber-700 text-[11px]">⚠️ Sangat Penting: Harus mengarah ke subfolder <strong>/public</strong>, bukan root Laravel! File <code className="font-mono">.htaccess</code> yang telah kami sediakan di dalam folder public akan otomatis menangani routing REST API.</span>
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                        <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px]">4</span>
                        Konfigurasi .env Backend di cPanel
                      </div>
                      <button
                        onClick={() => handleCopy(`APP_NAME=SIMPANANKU
APP_ENV=production
APP_KEY=base64:SALIN_KEY_LOKAL_ANDA
APP_DEBUG=false
APP_URL=https://api.domainanda.com

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=u123_simpananku
DB_USERNAME=u123_smpuser
DB_PASSWORD=Password_Database_Anda

CORS_ALLOWED_ORIGINS="https://app.domainanda.com,https://domainanda.com"`, 'cpanel-env')}
                        className="text-[11px] text-emerald-700 inline-flex items-center gap-1 hover:underline"
                      >
                        {copiedId === 'cpanel-env' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        Salin Contoh .env
                      </button>
                    </div>
                    <p className="text-xs text-slate-600">
                      Sesuaikan kredensial basis data dan masukkan domain frontend Anda pada <code className="font-mono">CORS_ALLOWED_ORIGINS</code> agar tidak terblokir oleh browser.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                      <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px]">5</span>
                      Build & Unggah Frontend React (Folder dist/)
                    </div>
                    <p className="text-xs text-slate-600">
                      Di komputer lokal, set <code className="font-mono">VITE_API_URL=https://api.domainanda.com/api/v1</code> lalu jalankan <code className="font-mono bg-slate-200 px-1 rounded">npm run build</code>. Unggah seluruh isi file dalam folder <code className="font-mono">dist/</code> ke Document Root frontend cPanel (<code className="font-mono">public_html</code>).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: VPS UBUNTU & NGINX */}
          {guideCategory === 'vps' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-emerald-700" />
                    <h3 className="font-bold text-slate-900 text-base">Panduan Deployment ke VPS Linux (Ubuntu 22.04 / 24.04 & Nginx)</h3>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">PHP 8.2-FPM + Nginx + Certbot SSL</span>
                </div>

                <div className="space-y-4">
                  {/* Step 1 */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
                      <span>1. Install Nginx, PHP 8.2, MariaDB & Node.js</span>
                      <button
                        onClick={() => handleCopy(`sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx mariadb-server git unzip curl
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
sudo apt install -y php8.2 php8.2-fpm php8.2-mysql php8.2-mbstring php8.2-xml php8.2-curl php8.2-gd php8.2-zip php8.2-bcmath
curl -sS https://getcomposer.org/installer | php && sudo mv composer.phar /usr/local/bin/composer
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs`, 'vps-pkg')}
                        className="text-[11px] text-emerald-700 inline-flex items-center gap-1 hover:underline"
                      >
                        {copiedId === 'vps-pkg' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        Salin Bash Script
                      </button>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl text-xs font-mono text-emerald-300 border border-slate-800">
                      sudo apt install -y nginx php8.2 php8.2-fpm php8.2-mysql php8.2-mbstring php8.2-gd php8.2-zip
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
                      <span>2. Konfigurasi Izin Akses (Permissions) Storage Laravel</span>
                      <button
                        onClick={() => handleCopy(`sudo chown -R www-data:www-data /var/www/simpananku/backend-laravel/storage /var/www/simpananku/backend-laravel/bootstrap/cache
sudo chmod -R 775 /var/www/simpananku/backend-laravel/storage /var/www/simpananku/backend-laravel/bootstrap/cache`, 'vps-perm')}
                        className="text-[11px] text-emerald-700 inline-flex items-center gap-1 hover:underline"
                      >
                        {copiedId === 'vps-perm' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        Salin Perintah
                      </button>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl text-xs font-mono text-slate-200 border border-slate-800">
                      sudo chown -R www-data:www-data /var/www/simpananku/backend-laravel/storage /var/www/simpananku/backend-laravel/bootstrap/cache
                    </div>
                  </div>

                  {/* Step 3: Nginx Block */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
                      <span>3. File Blok Konfigurasi Nginx (/etc/nginx/sites-available/simpananku)</span>
                      <button
                        onClick={() => handleCopy(`server {
    listen 80;
    server_name domainanda.com;

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

        location ~ \\.php$ {
            fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
            fastcgi_param SCRIPT_FILENAME /var/www/simpananku/backend-laravel/public/index.php;
            include fastcgi_params;
        }
    }

    location @laravel {
        rewrite /api/(.*)$ /api/$1 last;
    }

    location ~ /\\.ht {
        deny all;
    }
}`, 'nginx-conf')}
                        className="text-[11px] text-emerald-700 inline-flex items-center gap-1 hover:underline"
                      >
                        {copiedId === 'nginx-conf' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        Salin Nginx Config
                      </button>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl text-xs font-mono text-emerald-300 border border-slate-800 overflow-x-auto max-h-48">
                      <pre><code>{`server {
    listen 80;
    server_name domainanda.com;
    root /var/www/simpananku/dist;
    ...
}`}</code></pre>
                    </div>
                  </div>

                  {/* Step 4: SSL */}
                  <div>
                    <span className="text-xs font-bold text-slate-800 block mb-1">4. Pasang SSL Gratis (Let's Encrypt Certbot)</span>
                    <div className="p-3 bg-slate-950 rounded-xl text-xs font-mono text-amber-300 border border-slate-800">
                      sudo apt install -y certbot python3-certbot-nginx && sudo certbot --nginx -d domainanda.com
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DOCKER COMPOSE */}
          {guideCategory === 'docker' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Box className="w-5 h-5 text-emerald-700" />
                    <h3 className="font-bold text-slate-900 text-base">Menjalankan dengan Docker Compose (All-in-One Container)</h3>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                    File: docker-compose.yml
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Kami telah menyediakan konfigurasi <code className="font-mono font-bold text-slate-800">docker-compose.yml</code> dan <code className="font-mono font-bold text-slate-800">backend-laravel/Dockerfile</code> lengkap. Ini akan menginstansiasi 3 service secara terisolasi: Database MariaDB 10.11, Backend Laravel 13, dan Frontend Vite SPA.
                </p>

                <div className="space-y-3">
                  <div className="p-4 bg-slate-950 rounded-xl text-xs font-mono text-slate-200 border border-slate-800 relative">
                    <button
                      onClick={() => handleCopy(`docker compose up -d
docker compose exec backend php artisan migrate --seed`, 'docker-cmd')}
                      className="absolute right-3 top-3 p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition-colors"
                      title="Salin"
                    >
                      {copiedId === 'docker-cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <div className="text-slate-500 mb-1"># Jalankan seluruh stack:</div>
                    <div className="text-emerald-400 font-bold">docker compose up -d</div>
                    <div className="text-slate-500 mt-2 mb-1"># Eksekusi migrasi & seeder di dalam container backend:</div>
                    <div className="text-amber-300 font-bold">docker compose exec backend php artisan migrate --seed</div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <div className="font-bold text-slate-800">Frontend Port:</div>
                      <div className="font-mono text-emerald-700 font-bold">http://localhost:3000</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <div className="font-bold text-slate-800">Backend API Port:</div>
                      <div className="font-mono text-blue-700 font-bold">http://localhost:8000</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <div className="font-bold text-slate-800">MariaDB Port:</div>
                      <div className="font-mono text-purple-700 font-bold">localhost:3306</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DEMO ACCOUNTS */}
          {guideCategory === 'demo' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-emerald-700" />
                  <h3 className="font-bold text-slate-900 text-base">Daftar Akun Uji Coba Terdaftar (Hasil Seeder)</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Setelah menjalankan <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-semibold">php artisan migrate --seed</code>, basis data secara otomatis terisi akun-akun demonstrasi berikut yang dapat langsung digunakan untuk menguji seluruh hak akses sistem:
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Peran (Role)</th>
                        <th className="p-3">Email / Username</th>
                        <th className="p-3">Kata Sandi</th>
                        <th className="p-3">No. Anggota</th>
                        <th className="p-3">Kewenangan Fitur</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-rose-700">Administrator</td>
                        <td className="p-3 font-mono">admin@simpananku.my.id</td>
                        <td className="p-3 font-mono font-bold text-slate-800">admin123</td>
                        <td className="p-3 text-slate-400">-</td>
                        <td className="p-3 text-slate-600">Audit syariah DSN-MUI, master produk simpanan, laporan analitik</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-emerald-700">Teller Kasir</td>
                        <td className="p-3 font-mono">teller@simpananku.my.id</td>
                        <td className="p-3 font-mono font-bold text-slate-800">teller123</td>
                        <td className="p-3 text-slate-400">-</td>
                        <td className="p-3 text-slate-600">Pendaftaran anggota baru (AG0001+), setor & tarik tunai, akad gadai rahn, kredit barang murabahah, cetak kwitansi & buku tabungan</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-blue-700">Nasabah 1</td>
                        <td className="p-3 font-mono">nasabah@simpananku.my.id</td>
                        <td className="p-3 font-mono font-bold text-slate-800">nasabah123</td>
                        <td className="p-3 font-mono font-bold text-emerald-800">AG0001</td>
                        <td className="p-3 text-slate-600">Saldo tabungan wadiah & mudharabah, 1 akad gadai aktif, 1 cicilan murabahah</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-blue-700">Nasabah 2</td>
                        <td className="p-3 font-mono">khadijah@simpananku.my.id</td>
                        <td className="p-3 font-mono font-bold text-slate-800">nasabah123</td>
                        <td className="p-3 font-mono font-bold text-emerald-800">AG0002</td>
                        <td className="p-3 text-slate-600">Tabungan Wadiah Titipan & Tabungan Qurban/Haji</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-blue-700">Nasabah 3</td>
                        <td className="p-3 font-mono">bambang@gmail.com</td>
                        <td className="p-3 font-mono font-bold text-slate-800">nasabah123</td>
                        <td className="p-3 font-mono font-bold text-emerald-800">AG0003</td>
                        <td className="p-3 text-slate-600">Tabungan Sukarela Wadiah</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: TROUBLESHOOTING */}
          {guideCategory === 'troubleshoot' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-slate-900 text-base">Troubleshooting & Solusi Masalah Umum</h3>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-1.5">
                    <div className="font-bold text-rose-900 text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      Error 500: "The stream or file storage/logs/laravel.log could not be opened in append mode: failed to open stream: Permission denied"
                    </div>
                    <p className="text-xs text-rose-800">
                      <strong>Penyebab:</strong> Web server tidak memiliki hak tulis pada folder storage.
                    </p>
                    <div className="p-2 bg-slate-900 rounded font-mono text-[11px] text-emerald-300">
                      chmod -R 775 storage bootstrap/cache && chown -R www-data:www-data storage bootstrap/cache
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-1.5">
                    <div className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Error CORS: "Access to fetch at '...' has been blocked by CORS policy"
                    </div>
                    <p className="text-xs text-amber-800">
                      <strong>Penyebab:</strong> Domain frontend belum ditambahkan ke whitelist di file <code className="font-mono">backend-laravel/.env</code>.
                    </p>
                    <p className="text-xs text-amber-800">
                      <strong>Solusi:</strong> Ubah <code className="font-mono bg-white px-1 rounded">CORS_ALLOWED_ORIGINS="http://localhost:3000,https://app.domainanda.com"</code> lalu jalankan <code className="font-mono bg-white px-1 rounded">php artisan config:clear</code>.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-1.5">
                    <div className="font-bold text-blue-900 text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      Halaman Frontend 404 saat di-Refresh di Browser (Hosting / VPS)
                    </div>
                    <p className="text-xs text-blue-800">
                      <strong>Penyebab:</strong> Web server mencari folder/file fisik alih-alih mengarahkan rute SPA ke <code className="font-mono">index.html</code>.
                    </p>
                    <p className="text-xs text-blue-800">
                      <strong>Solusi:</strong> Pastikan file <code className="font-mono">.htaccess</code> sudah ada di folder public frontend (untuk Apache/cPanel) atau <code className="font-mono">try_files $uri $uri/ /index.html;</code> di konfigurasi Nginx.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* CODE EXPLORER VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: File Explorer */}
          <div className="lg:col-span-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FolderTree className="w-4 h-4 text-emerald-600" />
                Daftar File Proyek & Skrip
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                {LARAVEL_13_FILES.length} Files
              </span>
            </div>

            <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
              {categories.map((cat) => (
                <div key={cat} className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-2">
                    {cat}
                  </span>
                  {LARAVEL_13_FILES.filter((f) => f.category === cat).map((file) => (
                    <button
                      key={file.path}
                      onClick={() => setSelectedFile(file)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2 transition-all ${
                        selectedFile.path === file.path
                          ? 'bg-emerald-800 text-white font-semibold shadow-xs'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <FileCode className={`w-3.5 h-3.5 shrink-0 ${
                        selectedFile.path === file.path ? 'text-amber-300' : 'text-slate-400'
                      }`} />
                      <span className="truncate font-mono text-[11px]">{file.path}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Code Viewer */}
          <div className="lg:col-span-8 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden text-slate-200">
            {/* File Header */}
            <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="ml-2 font-mono text-xs text-slate-300 font-bold">
                  {selectedFile.path}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 uppercase font-mono">
                  {selectedFile.category}
                </span>
                <button
                  onClick={() => handleCopy(selectedFile.code, selectedFile.path)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition-colors border border-slate-700"
                >
                  {copiedId === selectedFile.path ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedId === selectedFile.path ? 'Tersalin' : 'Salin File'}
                </button>
              </div>
            </div>

            {/* File description note */}
            <div className="px-5 py-2.5 bg-slate-900/60 border-b border-slate-800 text-xs text-slate-400 leading-relaxed">
              {selectedFile.description}
            </div>

            {/* Code Textarea / Viewer */}
            <div className="p-5 overflow-x-auto max-h-[600px] overflow-y-auto">
              <pre className="font-mono text-xs text-emerald-300 leading-relaxed">
                <code>{selectedFile.code}</code>
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
