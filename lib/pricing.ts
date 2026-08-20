import seatPricingData from "@/data/seat_pricing.json";
import apiBaseFeePricingData from "@/data/api_base_fee_pricing.json";

export interface SeatTier {
  seats: number | null;
  pricePerSeatMonthly: number;
  pricePerSeatYearly: number;
  listPrice: number | null;
  ceilingPrice: number | null;
  ceilingPct: number | null;
  floorPrice: number | null;
  floorPct: number | null;
  guide: string | null;
}

export interface ApiBaseFeeTier {
  qtyPerYear: number | null;
  recommendedUnitPrice: number;
  recommendedPct: number;
  floorUnitPrice: number;
  floorPct: number;
  recommendedSupply: number | null;
  floorSupply: number | null;
  baseFeeListPrice: number | null;
  baseFeeFloorPrice: number | null;
  guide: string | null;
}

export const FEE_TYPE_SEAT = "기본 이용료";
export const FEE_TYPE_API_BASE = "API 기본 이용료";

const seatTiers: SeatTier[] = seatPricingData as SeatTier[];
const apiBaseFeeTiers: ApiBaseFeeTier[] = apiBaseFeePricingData as ApiBaseFeeTier[];

/**
 * 필요 시트 수를 감당하는 가장 작은 번들 티어를 찾는다 (없으면 최상위 "1,000개 초과" 티어 반환).
 * 시트 티어는 묶음(번들) 단위 판매이므로, 실제 필요 수량이 아니라 매칭된 티어의 고정가를 사용한다.
 */
export function getSeatTier(neededSeats: number): SeatTier {
  const fit = seatTiers.find((t) => t.seats !== null && t.seats >= neededSeats);
  return fit ?? seatTiers[seatTiers.length - 1];
}

/**
 * 연간 API 서명요청 수량을 감당하는 가장 작은 티어를 찾는다 (없으면 "100,000건 초과" 티어 반환).
 */
export function getApiBaseFeeTier(neededQtyPerYear: number): ApiBaseFeeTier {
  const fit = apiBaseFeeTiers.find((t) => t.qtyPerYear !== null && t.qtyPerYear >= neededQtyPerYear);
  return fit ?? apiBaseFeeTiers[apiBaseFeeTiers.length - 1];
}

export const SEAT_TIERS = seatTiers;
export const API_BASE_FEE_TIERS = apiBaseFeeTiers;
