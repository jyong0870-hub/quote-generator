"use client";

import { Fragment, useState } from "react";
import { QuoteData } from "@/app/page";

interface Props {
  quoteData: QuoteData;
  onReset: () => void;
}

const METHOD_LABELS: Record<string, string> = {
  weighted: "인근 수량 가중 평균",
  exact: "동일 수량 평균",
  interpolated: "구간 보간",
  edge_lower: "하한 기준",
  edge_upper: "상한 기준",
  default: "기본값",
};

const METHOD_COLORS: Record<string, string> = {
  weighted: "bg-blue-100 text-blue-700",
  exact: "bg-green-100 text-green-700",
  interpolated: "bg-purple-100 text-purple-700",
  edge_lower: "bg-yellow-100 text-yellow-700",
  edge_upper: "bg-yellow-100 text-yellow-700",
  default: "bg-slate-100 text-slate-600",
};

export default function QuoteResult({ quoteData, onReset }: Props) {
  const { input, contractRecs, items, totalPreTax, totalVat, totalWithVat } = quoteData;
  const [showHubSpotInfo, setShowHubSpotInfo] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const lines = [
      `[${input.companyName} 견적서]`,
      ``,
      ...items.map(
        (item) =>
          `${item.name}: ${item.qty.toLocaleString()}${item.qty === 1 ? "" : "건"} × ${item.unitPrice.toLocaleString()}원 (${item.discountPct}% 할인) = ${item.amount.toLocaleString()}원`
      ),
      ``,
      `소계: ${totalPreTax.toLocaleString()}원`,
      `VAT(10%): ${totalVat.toLocaleString()}원`,
      `합계: ${totalWithVat.toLocaleString()}원`,
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Recommendation */}
      <div className="lg:col-span-1 space-y-4">
        {/* Discount Recommendation Cards (계약 건수 항목별, 기본/API 각각 별도 DB 기준) */}
        {contractRecs.map((cr, idx) => (
          <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-700">
                AI 할인율 추천 <span className="text-slate-400 font-normal">· {cr.type}</span>
              </h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${METHOD_COLORS[cr.rec.method]}`}>
                {METHOD_LABELS[cr.rec.method]}
              </span>
            </div>

            {/* Main recommendation */}
            <div className="text-center py-4">
              <div className="text-5xl font-black text-blue-600">
                {cr.rec.recommended_pct}%
              </div>
              <div className="text-sm text-slate-500 mt-1">{cr.type} 계약 건수 할인율 ({cr.qty.toLocaleString()}건)</div>
            </div>

            <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3 mt-2">
              {cr.rec.note}
            </div>

            {/* Similar records */}
            {cr.rec.similar_records.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium text-slate-500 mb-2">참고 견적 ({cr.rec.similar_records.length}건)</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {cr.rec.similar_records.map((r, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 truncate max-w-[140px]">{r.company}</span>
                      <span className="text-slate-800 font-semibold ml-2">
                        {r.qty.toLocaleString()}건 / {r.discount_pct}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interpolation bounds */}
            {cr.rec.lower_bound && cr.rec.upper_bound && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="bg-slate-50 rounded-lg p-2 text-center">
                  <div className="text-xs text-slate-400">하한</div>
                  <div className="text-sm font-bold text-slate-700">{cr.rec.lower_bound.qty.toLocaleString()}건</div>
                  <div className="text-blue-600 font-semibold text-sm">{cr.rec.lower_bound.discount_pct}%</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2 text-center">
                  <div className="text-xs text-slate-400">상한</div>
                  <div className="text-sm font-bold text-slate-700">{cr.rec.upper_bound.qty.toLocaleString()}건</div>
                  <div className="text-blue-600 font-semibold text-sm">{cr.rec.upper_bound.discount_pct}%</div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* HubSpot Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-3">HubSpot 연동</h3>
          <button
            onClick={() => setShowHubSpotInfo(!showHubSpotInfo)}
            className="w-full flex items-center justify-between text-sm text-slate-500 bg-slate-50 rounded-lg px-4 py-3 hover:bg-slate-100 transition"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
              HubSpot Quote 자동 생성
            </div>
            <span className="text-xs bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">설정 필요</span>
          </button>
          {showHubSpotInfo && (
            <div className="mt-3 text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
              <p className="font-semibold text-amber-700">HubSpot Private App Token 필요</p>
              <p>1. HubSpot 포털 → 설정 → 통합 → Private Apps</p>
              <p>2. 앱 생성 → crm.objects.quotes.write 권한 부여</p>
              <p>3. 발급된 토큰을 환경변수에 추가:</p>
              <code className="block bg-amber-100 p-1.5 rounded mt-1 text-amber-800 font-mono">
                HUBSPOT_API_KEY=pat-na1-xxx...
              </code>
              <p className="mt-1">설정 후 이 버튼이 활성화됩니다.</p>
            </div>
          )}
        </div>

        <button
          onClick={onReset}
          className="w-full text-sm text-slate-500 hover:text-slate-700 py-2 transition"
        >
          ← 새 견적 작성
        </button>
      </div>

      {/* Right: Quote Preview */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Quote header */}
          <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-5 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-blue-200 text-xs font-medium mb-1">견적서</p>
                <h2 className="text-2xl font-black">{input.companyName}</h2>
              </div>
              <div className="text-right">
                <p className="text-blue-200 text-xs">총 금액 (VAT 포함)</p>
                <p className="text-2xl font-black mt-0.5">
                  {totalWithVat.toLocaleString()}원
                </p>
              </div>
            </div>
          </div>

          {/* Line items table */}
          <div className="px-6 py-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 text-xs font-semibold text-slate-500">항목</th>
                  <th className="text-right py-2 text-xs font-semibold text-slate-500">수량</th>
                  <th className="text-right py-2 text-xs font-semibold text-slate-500">단가</th>
                  <th className="text-right py-2 text-xs font-semibold text-slate-500">할인율</th>
                  <th className="text-right py-2 text-xs font-semibold text-slate-500">금액</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <Fragment key={i}>
                    <tr className="border-b border-slate-50 hover:bg-slate-50 transition">
                      <td className="py-3 font-medium text-slate-800">{item.name}</td>
                      <td className="py-3 text-right text-slate-600">
                        {item.qty.toLocaleString()}{item.qty === 1 ? "" : "건"}
                      </td>
                      <td className="py-3 text-right text-slate-600">
                        {item.unitPrice.toLocaleString()}원
                      </td>
                      <td className="py-3 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          item.discountPct >= 70 ? "bg-red-100 text-red-700" :
                          item.discountPct >= 60 ? "bg-orange-100 text-orange-700" :
                          item.discountPct >= 50 ? "bg-yellow-100 text-yellow-700" :
                          "bg-green-100 text-green-700"
                        }`}>
                          {item.discountPct}%
                        </span>
                      </td>
                      <td className="py-3 text-right font-semibold text-slate-900">
                        {item.amount.toLocaleString()}원
                      </td>
                    </tr>
                    {item.rationale && (
                      <tr className="border-b border-slate-50">
                        <td colSpan={5} className="pb-3 pt-0">
                          <div className="flex items-start gap-2 bg-blue-50/60 rounded-lg px-3 py-2 text-xs text-slate-600">
                            <span className={`shrink-0 px-2 py-0.5 rounded-full font-semibold ${METHOD_COLORS[item.rationale.method]}`}>
                              {METHOD_LABELS[item.rationale.method]}
                            </span>
                            <span>{item.rationale.note}</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="px-6 pb-5">
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>소계 (VAT 제외)</span>
                <span className="font-medium">{totalPreTax.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>부가세 (10%)</span>
                <span className="font-medium">{totalVat.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>합계 (VAT 포함)</span>
                <span className="text-blue-700">{totalWithVat.toLocaleString()}원</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium py-2.5 rounded-xl transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {copied ? "복사됨 ✓" : "클립보드 복사"}
              </button>
              <button
                disabled
                className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-400 cursor-not-allowed text-sm font-medium py-2.5 rounded-xl"
                title="HubSpot API 설정 후 사용 가능"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                HubSpot로 전송
              </button>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-slate-400 mt-3 text-center">
          * 본 견적은 참고용입니다. 최종 견적은 영업팀에서 확인 후 HubSpot에 등록해 주세요.
        </p>
      </div>
    </div>
  );
}
