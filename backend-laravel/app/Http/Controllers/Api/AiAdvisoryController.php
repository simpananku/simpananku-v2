<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\GeminiAiService;
use App\Services\ShariaValidationService;
use Illuminate\Http\Request;

class AiAdvisoryController extends Controller
{
    protected GeminiAiService $aiService;
    protected ShariaValidationService $shariaService;

    public function __construct(GeminiAiService $aiService, ShariaValidationService $shariaService)
    {
        $this->aiService = $aiService;
        $this->shariaService = $shariaService;
    }

    /**
     * AI-Native: Audit Kepatuhan Akad Syariah (Sharia Smart Contract Checker).
     */
    public function auditSharia(Request $request)
    {
        $validated = $request->validate([
            'contract_type' => 'required|string|in:wadiah,mudharabah,rahn,murabahah',
            'contract_details' => 'required|array',
        ]);

        $auditResult = $this->aiService->auditContractCompliance(
            $validated['contract_type'],
            $validated['contract_details']
        );

        return response()->json([
            'success' => true,
            'contract_type' => $validated['contract_type'],
            'ai_audit' => $auditResult,
        ]);
    }

    /**
     * AI-Native: Taksiran Cerdas Nilai Marhun Barang Gadai (Smart Appraisal).
     */
    public function estimateMarhun(Request $request)
    {
        $validated = $request->validate([
            'item_type' => 'required|string',
            'item_description' => 'required|string',
            'initial_estimate' => 'required|numeric|min:10000',
        ]);

        $estimateResult = $this->aiService->estimatePawnValuation(
            $validated['item_type'],
            $validated['item_description'],
            $validated['initial_estimate']
        );

        return response()->json([
            'success' => true,
            'appraisal' => $estimateResult,
        ]);
    }
}
