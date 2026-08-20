"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Label,
} from "recharts";
import contractRecords from "@/data/contract_records.json";

interface Props {
  highlightQty: number | null;
}

interface TooltipPayload {
  payload: {
    company: string;
    qty: number;
    discount_pct: number;
  };
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-xs">
        <p className="font-semibold text-slate-800">{d.company}</p>
        <p className="text-slate-500 mt-0.5">
          {d.qty.toLocaleString()}건 · <span className="font-bold text-blue-600">{d.discount_pct}%</span> 할인
        </p>
      </div>
    );
  }
  return null;
};

export default function DiscountChart({ highlightQty }: Props) {
  const data = contractRecords.map((r) => ({
    ...r,
    x: r.qty,
    y: r.discount_pct,
  }));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-700">견적 DB 수량별 할인율 분포</h3>
          <p className="text-xs text-slate-400 mt-0.5">총 {data.length}건 · 계약 건수 기준</p>
        </div>
        {highlightQty && (
          <div className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
            현재 입력: {highlightQty.toLocaleString()}건
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="x"
            type="number"
            domain={[0, "auto"]}
            tickFormatter={(v) =>
              v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
            }
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            label={{ value: "계약 건수", position: "insideBottom", offset: -10, fontSize: 11, fill: "#94a3b8" }}
          />
          <YAxis
            dataKey="y"
            type="number"
            domain={[30, 90]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
          />
          <Tooltip content={<CustomTooltip />} />
          {highlightQty && (
            <ReferenceLine
              x={highlightQty}
              stroke="#3b82f6"
              strokeDasharray="4 4"
              strokeWidth={2}
            >
              <Label value="▼" position="top" fill="#3b82f6" fontSize={14} />
            </ReferenceLine>
          )}
          <Scatter
            data={data}
            fill="#3b82f6"
            fillOpacity={0.7}
            r={6}
          />
        </ScatterChart>
      </ResponsiveContainer>
      <div className="mt-3 grid grid-cols-3 gap-3 text-center">
        {[
          { range: "~1,000건", avg: Math.round(data.filter(d => d.qty <= 1000).reduce((s, d) => s + d.discount_pct, 0) / data.filter(d => d.qty <= 1000).length), label: "소량" },
          { range: "1,000~5,000건", avg: Math.round(data.filter(d => d.qty > 1000 && d.qty <= 5000).reduce((s, d) => s + d.discount_pct, 0) / Math.max(1, data.filter(d => d.qty > 1000 && d.qty <= 5000).length)), label: "중량" },
          { range: "5,000건~", avg: Math.round(data.filter(d => d.qty > 5000).reduce((s, d) => s + d.discount_pct, 0) / Math.max(1, data.filter(d => d.qty > 5000).length)), label: "대량" },
        ].map((tier) => (
          <div key={tier.range} className="bg-slate-50 rounded-xl p-3">
            <div className="text-xs text-slate-400">{tier.label}</div>
            <div className="text-xs text-slate-500 mt-0.5">{tier.range}</div>
            <div className="text-lg font-black text-blue-600 mt-1">{tier.avg}%</div>
            <div className="text-xs text-slate-400">평균 할인</div>
          </div>
        ))}
      </div>
    </div>
  );
}
