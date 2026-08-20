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
  API_USAGE_FEE_TYPE,
} from "@/lib/discount";

export interface FeeItem {
  type: string;
  price?: number;
  qty?: number;
}

export interface QuoteInput {
  companyName: string;
  feeItems: FeeItem[];
  contractQty: number;
}

export interface QuoteData {
  input: QuoteInput;
  contractDiscountRec: ReturnType<typeof recommendDiscount>;
  items: {
    name: string;
    qty: number;
    unitPrice: number;
    discountPct: number;
    amount: number;
    isFree?: boolean;
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

    // 할인율 추천
    const contractDiscountRec = recommendDiscount(input.contractQty);
    const contractDiscountPct = contractDiscountRec.recommended_pct;

    // 견적 항목 계산
    const items: QuoteData["items"] = [];

    // 이용료 항목 (기본 이용료 / API 기본 이용료 → 50% 고정, API 건당 이용료 → 별도 DB 기준 추천)
    input.feeItems.forEach((fee) => {
      if (fee.type === API_USAGE_FEE_TYPE) {
        if (fee.qty && fee.qty > 0) {
          const apiRec = recommendApiDiscount(fee.qty);
          const amount = calcAmount(API_UNIT_PRICE, fee.qty, apiRec.recommended_pct);
          items.push({
            name: API_USAGE_FEE_TYPE,
            qty: fee.qty,
            unitPrice: API_UNIT_PRICE,
            discountPct: apiRec.recommended_pct,
            amount,
            rationale: { method: apiRec.method, note: apiRec.note },
          });
        }
      } else if (fee.price && fee.price > 0) {
        const amount = calcAmount(fee.price, 1, 50);
        items.push({
          name: fee.type,
          qty: 1,
          unitPrice: fee.price,
          discountPct: 50,
          amount,
        });
      }
    });

    // 계약 건수
    if (input.contractQty > 0) {
      const amount = calcAmount(CONTRACT_UNIT_PRICE, input.contractQty, contractDiscountPct);
      items.push({
        name: "계약 건수",
        qty: input.contractQty,
        unitPrice: CONTRACT_UNIT_PRICE,
        discountPct: contractDiscountPct,
        amount,
        rationale: { method: contractDiscountRec.method, note: contractDiscountRec.note },
      });
    }

    const totalPreTax = items.reduce((s, i) => s + i.amount, 0);
    const totalVat = Math.round(totalPreTax * 0.1);
    const totalWithVat = totalPreTax + totalVat;

    setQuoteData({
      input,
      contractDiscountRec,
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
            DB {" "}
            <span className="font-semibold text-slate-600">{CONTRACT_RECORD_COUNT}건</span> 로드됨
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
            <DiscountChart highlightQty={quoteData.input.contractQty} />
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
