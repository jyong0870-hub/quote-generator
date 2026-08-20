"use client";

import { useState } from "react";
import { QuoteInput, FeeItem } from "@/app/page";
import { recommendApiDiscount, API_RECORD_COUNT, API_USAGE_FEE_TYPE } from "@/lib/discount";

interface Props {
  onGenerate: (input: QuoteInput) => void;
  isSubmitting: boolean;
}

const FEE_TYPES = ["기본 이용료", "API 기본 이용료", API_USAGE_FEE_TYPE] as const;

function formatNumber(value: string): string {
  const num = value.replace(/[^0-9]/g, "");
  return num ? Number(num).toLocaleString() : "";
}

function parseNumber(value: string): number {
  return parseInt(value.replace(/[^0-9]/g, "") || "0", 10);
}

interface FeeRow {
  id: number;
  type: string;
  priceStr: string;
  qtyStr: string;
}

let nextRowId = 1;

export default function QuoteForm({ onGenerate, isSubmitting }: Props) {
  const [companyName, setCompanyName] = useState("");
  const [feeRows, setFeeRows] = useState<FeeRow[]>([
    { id: nextRowId++, type: FEE_TYPES[0], priceStr: "", qtyStr: "" },
  ]);
  const [contractQty, setContractQty] = useState("");

  const updateRow = (id: number, patch: Partial<FeeRow>) => {
    setFeeRows((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const addRow = () => {
    setFeeRows((rows) => [...rows, { id: nextRowId++, type: FEE_TYPES[0], priceStr: "", qtyStr: "" }]);
  };

  const removeRow = (id: number) => {
    setFeeRows((rows) => rows.filter((r) => r.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const feeItems: FeeItem[] = feeRows
      .map((r) =>
        r.type === API_USAGE_FEE_TYPE
          ? { type: r.type, qty: parseNumber(r.qtyStr) }
          : { type: r.type, price: parseNumber(r.priceStr) }
      )
      .filter((f) => (f.qty ?? f.price ?? 0) > 0);
    onGenerate({
      companyName,
      feeItems,
      contractQty: parseNumber(contractQty),
    });
  };

  const isValid = companyName.trim() && parseNumber(contractQty) > 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="mb-6">
        <h2 className="text-base font-bold text-slate-900">견적 정보 입력</h2>
        <p className="text-xs text-slate-500 mt-1">이용료 항목은 자동으로 50% 할인 적용됩니다</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 회사명 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            회사명 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="예: 모두싸인컴퍼니"
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {/* 이용료 항목 (기본 이용료 / API 기본 이용료 / API 건당 이용료 통합) */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            이용료 항목
            <span className="ml-2 text-xs font-normal text-slate-400">기본 이용료는 50% 고정, API 건당 이용료는 DB 기준 자동 추천</span>
          </label>
          <div className="space-y-2">
            {feeRows.map((row) => {
              const isApiUsage = row.type === API_USAGE_FEE_TYPE;
              const apiRec = isApiUsage && row.qtyStr ? recommendApiDiscount(parseNumber(row.qtyStr)) : null;
              return (
                <div key={row.id}>
                  <div className="flex items-center gap-2">
                    <select
                      value={row.type}
                      onChange={(e) => updateRow(row.id, { type: e.target.value })}
                      className="w-[9.5rem] shrink-0 px-3 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    >
                      {FEE_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    {isApiUsage ? (
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={row.qtyStr}
                          onChange={(e) => updateRow(row.id, { qtyStr: formatNumber(e.target.value) })}
                          placeholder="예: 500"
                          className="w-full px-4 py-2.5 pr-8 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">건</span>
                      </div>
                    ) : (
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={row.priceStr}
                          onChange={(e) => updateRow(row.id, { priceStr: formatNumber(e.target.value) })}
                          placeholder="예: 500,000"
                          className="w-full px-4 py-2.5 pr-8 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">원</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      className="shrink-0 w-9 h-9 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      aria-label="항목 삭제"
                    >
                      ✕
                    </button>
                  </div>
                  {isApiUsage
                    ? apiRec && (
                        <p className="text-xs text-slate-500 mt-1 ml-[10.5rem]">
                          → 추천 할인율:{" "}
                          <span className="font-semibold text-blue-600">{apiRec.recommended_pct}%</span>{" "}
                          <span className="text-slate-400">(API 견적 DB {API_RECORD_COUNT}건 기준, {apiRec.note})</span>
                        </p>
                      )
                    : row.priceStr && (
                        <p className="text-xs text-slate-500 mt-1 ml-[10.5rem]">
                          → 적용 금액:{" "}
                          <span className="font-semibold text-blue-600">
                            {Math.round(parseNumber(row.priceStr) * 0.5).toLocaleString()}원
                          </span>
                        </p>
                      )}
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={addRow}
            className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-700 transition"
          >
            + 항목 추가
          </button>
        </div>

        {/* 계약 건수 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            계약 건수 <span className="text-red-500">*</span>
            <span className="ml-2 text-xs font-normal text-slate-400">단가 2,000원/건</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={contractQty}
              onChange={(e) => setContractQty(formatNumber(e.target.value))}
              placeholder="예: 1,000"
              className="w-full px-4 py-2.5 pr-8 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">건</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              분석 중...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              할인율 추천 및 견적 생성
            </>
          )}
        </button>
      </form>
    </div>
  );
}
