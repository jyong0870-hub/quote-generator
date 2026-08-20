import contractRecords from "@/data/contract_records.json";
import apiContractRecords from "@/data/api_contract_records.json";

export interface ContractRecord {
  company: string;
  qty: number;
  discount_pct: number;
  unit_price: number;
}

export interface DiscountRecommendation {
  recommended_pct: number;
  method: string;
  similar_records: ContractRecord[];
  lower_bound: { qty: number; discount_pct: number } | null;
  upper_bound: { qty: number; discount_pct: number } | null;
  note: string;
}

const records: ContractRecord[] = contractRecords as ContractRecord[];
const apiRecords: ContractRecord[] = apiContractRecords as ContractRecord[];

/**
 * 입력 수량에 대한 할인율 추천
 * 1. 정확히 일치하는 수량 → 해당 할인율 평균
 * 2. 유사 수량(±30%) → 가중 평균
 * 3. 없으면 보간 (바로 아래/위 값 선형 보간)
 */
function recommendFrom(recordSet: ContractRecord[], targetQty: number): DiscountRecommendation {
  // 1. Exact match
  const exactMatches = recordSet.filter((r) => r.qty === targetQty);
  if (exactMatches.length > 0) {
    const avg =
      exactMatches.reduce((s, r) => s + r.discount_pct, 0) /
      exactMatches.length;
    return {
      recommended_pct: Math.round(avg),
      method: "exact",
      similar_records: exactMatches,
      lower_bound: null,
      upper_bound: null,
      note: `동일 수량(${targetQty.toLocaleString()}건) 견적 ${exactMatches.length}건 기준 평균`,
    };
  }

  // 2. Nearby ±40%
  const nearby = recordSet.filter(
    (r) =>
      r.qty >= targetQty * 0.6 &&
      r.qty <= targetQty * 1.4 &&
      r.qty !== targetQty
  );
  if (nearby.length >= 2) {
    // Weighted average: closer qty = higher weight
    const weights = nearby.map((r) => 1 / Math.abs(r.qty - targetQty));
    const totalWeight = weights.reduce((s, w) => s + w, 0);
    const weightedAvg = nearby.reduce(
      (s, r, i) => s + r.discount_pct * weights[i],
      0
    ) / totalWeight;
    return {
      recommended_pct: Math.round(weightedAvg),
      method: "nearby",
      similar_records: nearby.sort((a, b) => a.qty - b.qty),
      lower_bound: null,
      upper_bound: null,
      note: `유사 수량 ${nearby.length}건 가중 평균 (수량 근접도 기준)`,
    };
  }

  // 3. Linear interpolation between nearest lower and upper
  const sorted = [...recordSet].sort((a, b) => a.qty - b.qty);
  const lower = [...sorted].reverse().find((r) => r.qty < targetQty);
  const upper = sorted.find((r) => r.qty > targetQty);

  if (lower && upper) {
    const ratio = (targetQty - lower.qty) / (upper.qty - lower.qty);
    const interpolated =
      lower.discount_pct + ratio * (upper.discount_pct - lower.discount_pct);
    return {
      recommended_pct: Math.round(interpolated),
      method: "interpolated",
      similar_records: [],
      lower_bound: { qty: lower.qty, discount_pct: lower.discount_pct },
      upper_bound: { qty: upper.qty, discount_pct: upper.discount_pct },
      note: `${lower.qty.toLocaleString()}건(${lower.discount_pct}%)~${upper.qty.toLocaleString()}건(${upper.discount_pct}%) 선형 보간`,
    };
  }

  // 4. Edge cases: below min or above max
  if (!lower && upper) {
    return {
      recommended_pct: upper.discount_pct,
      method: "edge_lower",
      similar_records: [upper],
      lower_bound: null,
      upper_bound: { qty: upper.qty, discount_pct: upper.discount_pct },
      note: `DB 최소 수량(${upper.qty.toLocaleString()}건) 기준 적용`,
    };
  }
  if (lower && !upper) {
    return {
      recommended_pct: lower.discount_pct,
      method: "edge_upper",
      similar_records: [lower],
      lower_bound: { qty: lower.qty, discount_pct: lower.discount_pct },
      upper_bound: null,
      note: `DB 최대 수량(${lower.qty.toLocaleString()}건) 기준 적용`,
    };
  }

  return {
    recommended_pct: 50,
    method: "default",
    similar_records: [],
    lower_bound: null,
    upper_bound: null,
    note: "기본 할인율 적용",
  };
}

/** 계약 건수(Cloud) 할인율 추천 */
export function recommendDiscount(targetQty: number): DiscountRecommendation {
  return recommendFrom(records, targetQty);
}

/** API 건당 이용료 할인율 추천 — 계약 건수와는 별도의 할인율 기준(DB)을 사용 */
export function recommendApiDiscount(targetQty: number): DiscountRecommendation {
  return recommendFrom(apiRecords, targetQty);
}

/** 할인 적용 후 금액 계산 */
export function calcAmount(
  unitPrice: number,
  qty: number,
  discountPct: number
): number {
  return Math.round(unitPrice * qty * (1 - discountPct / 100));
}

/** VAT 포함 금액 */
export function withVat(amount: number): number {
  return Math.round(amount * 1.1);
}

export const CONTRACT_UNIT_PRICE = 2000; // 건당 단가 (원)
export const CONTRACT_RECORD_COUNT = records.length;
export const API_UNIT_PRICE = 2000; // API 건당 단가 (원)
export const API_RECORD_COUNT = apiRecords.length;
export const CONTRACT_TYPE_BASIC = "기본(Cloud)";
export const CONTRACT_TYPE_API = "API";
