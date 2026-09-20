<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $query = Notification::orderBy('created_at', 'desc');
        if ($request->user()->role === 'nasabah') $query->where('target_member_number', $request->user()->member_id);

        if ($request->filled('member_number')) {
            $mem = $request->member_number;
            $query->where(function ($q) use ($mem) {
                $q->where('target_member_number', $mem)
                  ->orWhereNull('target_member_number');
            });
        }

        return response()->json([
            'success' => true,
            'data' => $query->limit(50)->get(),
        ]);
    }

    public function markAsRead(Request $request, $id)
    {
        $notif = Notification::findOrFail($id);
        abort_if($request->user()->role === 'nasabah' && $request->user()->member_id !== $notif->target_member_number, 403);
        $notif->read = true;
        $notif->save();

        return response()->json([
            'success' => true,
            'data' => $notif,
        ]);
    }

    public function markAllAsRead(Request $request)
    {
        $query = Notification::query();
        if ($request->user()->role === 'nasabah') $query->where('target_member_number', $request->user()->member_id);
        if ($request->filled('member_number')) {
            $query->where('target_member_number', $request->member_number);
        }
        $query->update(['read' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Semua notifikasi ditandai telah dibaca.',
        ]);
    }
}
