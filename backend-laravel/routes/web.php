<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'app' => 'SIMPANANKU API Backend',
        'framework' => 'Laravel 13 AI-Native',
        'status' => 'online',
        'standards' => '100% Prinsip Syariah (DSN-MUI)',
        'supported_akads' => [
            'Simpanan Wadiah Yad Dhamanah',
            'Simpanan Mudharabah Muthlaqah',
            'Gadai Syariah (Rahn & Ijarah Titipan)',
            'Kredit Barang (Murabahah Bi Tsaman Aajil)'
        ],
        'api_version' => 'v1',
        'documentation_url' => '/api/v1/dashboard/stats',
    ]);
});
