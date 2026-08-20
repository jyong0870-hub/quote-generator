"use client";

import { useState } from "react";
import QuoteForm from "@/components/QuoteForm";
import QuoteResult from "@/components/QuoteResult";
import DiscountChart from "@/components/DiscountChart";
import {
  recommendDiscount,
  recommendApiDiscount,
  calcAmount,
  withVat,
  CONTRACT_UNIT_PRICE,
  CONTRACT_RECORD_COUNT,
  API_UNIT_PRICE,
  API_RECORD_COUNT,
  CONTRACT_TYPE_BASIC,
  CONTRACT_TYPE_API,
} from "@/lib/discount";
import { getSeatTier, getApiBaseFeeTier, FEE_TYPE_SEAT, FEE_TYPE_API_BASE } from "@/lib/pricing";

export interface FeeItem {
  type: string; // FEE_TYPE_SEAT | FEE_TYPE_API_BASE
  qty: number; // 시트 개수 (기본 이용료) or 연간 API 서명요청 수량 (API 기본 이용료)
}

export interface ContractItem {
  type: string; // CONTRACT_TYPE_BASIC | CONTRACT_TYPE_API
  qty: number;
}

export interface QuoteInput {
  companyName: string;
  feeItems: FeeItem[];
  contractItems: ContractItem[];
}

export interface ContractLineRec {
  type: string;
  qty: number;
  rec: ReturnType<typeof recommendDiscount>;
}

export interface QuoteData {
  input: QuoteInput;
  contractRecs: ContractLineRec[];
  items: {
    name: string;
    qty: number;
    unitPrice: number;
    discountPct: number;
    amount: number;
    isFree?: boolean;
    isNegotiated?: boolean;
    rationale?: { method: string; note: string };
  }[];
  totalPreTax: number;
  totalVat: number;
  totalWithVat: number;
}

export default function Home() {
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGenerate = (input: QuoteInput) => {
    setIsSubmitting(true);

    const items: QuoteData["items"] = [];
    const contractRecs: ContractLineRec[] = [];

    // 이용료 항목 (기본 이용료 = 시트 번들, API 기본 이용료 = API 라이선스 기본료 — 둘 다 정책표 기준 50% 고정)
    input.feeItems.forEach((fee) => {
      if (!(fee.qty > 0)) return;

      if (fee.type === FEE_TYPE_SEAT) {
        const tier = getSeatTier(fee.qty);
        if (tier.listPrice != null && tier.floorPrice != null) {
          items.push({
            name: `기본 이용료 (${tier.seats?.toLocaleString()}개 시트 번들)`,
            qty: 1,
            unitPrice: tier.listPrice,
            discountPct: tier.floorPct ?? 50,
            amount: tier.floorPrice,
            rationale: tier.guide ? { method: "policy", note: tier.guide } : undefined,
          });
        } else {
          items.push({
            name: `기본 이용료 (${fee.qty.toLocaleString()}개 시트)`,
            qty: 1,
            unitPrice: 0,
            discountPct: 0,
            amount: 0,
            isNegotiated: true,
            rationale: { method: "negotiate", note: tier.guide ?? "1,000개 초과 — 비즈니스리더와 함께 논의 필요" },
          });
        }
      } else if (fee.type === FEE_TYPE_API_BASE) {
        const tier = getApiBaseFeeTier(fee.qty);
        if (tier.baseFeeListPrice != null && tier.baseFeeFloorPrice != null) {
          items.push({
            name: `API 기본 이용료 (연 ${tier.qtyPerYear?.toLocaleString()}건 이하)`,
            qty: 1,
            unitPrice: tier.baseFeeListPrice,
            discountPct: 50,
            amount: tier.baseFeeFloorPrice,
            rationale: tier.guide ? { method: "policy", note: tier.guide } : undefined,
          });
        } else {
          items.push({
            name: `API 기본 이용료 (연 ${fee.qty.toLocaleString()}건)`,
            qty: 1,
            unitPrice: 0,
            discountPct: 0,
            amount: 0,
            isNegotiated: true,
            rationale: { method: "negotiate", note: tier.guide ?? "100,000건 초과 — 그룹리더 포함 논의 필요" },
          });
        }
      }
    });

    // 계약 건수 (기본/API 별도 DB 기준 자동 추천)
    input.contractItems.forEach((c) => {
      if (c.qty > 0) {
        const isApi = c.type === CONTRACT_TYPE_API;
        const rec = isApi ? recommendApiDiscount(c.qty) : recommendDiscount(c.qty);
        const unitPrice = isApi ? API_UNIT_PRICE : CONTRACT_UNIT_PRICE;
        const amount = calcAmount(unitPrice, c.qty, rec.recommended_pct);
        items.push({
          name: isApi ? "계약 건수 (API)" : "계약 건수",
          qty: c.qty,
          unitPrice,
          discountPct: rec.recommended_pct,
          amount,
          rationale: { method: rec.method, note: rec.note },
        });
        contractRecs.push({ type: c.type, qty: c.qty, rec });
      }
    });

    const totalPreTax = items.reduce((s, i) => s + i.amount, 0);
    const totalVat = Math.round(totalPreTax * 0.1);
    const totalWithVat = totalPreTax + totalVat;

    setQuoteData({
      input,
      contractRecs,
      items,
      totalPreTax,
      totalVat,
      totalWithVat,
    });
    setIsSubmitting(false);
  };

  const handleReset = () => {
    setQuoteData(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">자동 견적 생성기</h1>
              <p className="text-xs text-slate-500">Modusign 내부용 · 견적 DB 기반 할인율 추천</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 bg-green-400 rounded-full inline-block"></span>
            계약 건수 DB <span className="font-semibold text-slate-600">{CONTRACT_RECORD_COUNT}건</span>
            <span className="text-slate-300">·</span>
            API DB <span className="font-semibold text-slate-600">{API_RECORD_COUNT}건</span> 로드됨
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {!quoteData ? (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Form */}
            <div className="lg:col-span-2">
              <QuoteForm onGenerate={handleGenerate} isSubmitting={isSubmitting} />
            </div>
            {/* Chart */}
            <div className="lg:col-span-3">
              <DiscountChart highlightQty={null} />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <QuoteResult quoteData={quoteData} onReset={handleReset} />
            <DiscountChart
              highlightQty={
                quoteData.input.contractItems.find((c) => c.type === CONTRACT_TYPE_BASIC && c.qty > 0)?.qty ?? null
              }
            />
          </div>
        )}
      </main>

      <footer className="mt-16 py-6 border-t border-slate-200 bg-white">
        <p className="text-center text-xs text-slate-400">
          Modusign 내부용 자동 견적 생성기 · 실제 견적서는 영업팀 최종 확인 후 사용
        </p>
      </footer>
    </div>
  );
}
