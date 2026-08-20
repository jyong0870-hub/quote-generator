# 자동 견적 생성기 — Modusign 내부용

계약 건수를 입력하면 과거 견적 DB 기반으로 할인율을 자동 추천하고 견적서를 생성합니다.

## 기능

- **할인율 자동 추천**: 수량 매칭 → 가중 평균 → 구간 보간 3단계 알고리즘
- **기본이용료 50% 고정**: 규칙 자동 적용
- **견적 DB 차트**: 수량별 할인율 분포 시각화
- **클립보드 복사**: 견적 내용 즉시 복사
- **HubSpot 연동** (설정 필요): 자동 Quote 생성

## 빠른 시작

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 접속

## 배포 (Vercel)

1. GitHub에 이 레포 push
2. [vercel.com](https://vercel.com) → Import Project → GitHub 레포 선택
3. 자동 빌드 & 배포

## HubSpot 연동 설정

1. `.env.local.example` → `.env.local` 복사
2. HubSpot 포털 → 설정 → 통합 → Private Apps
3. 앱 생성, 권한: `crm.objects.quotes.write`, `crm.objects.line_items.write`
4. 토큰을 `.env.local`의 `HUBSPOT_API_KEY`에 입력
5. Vercel 환경변수에도 동일하게 추가

## 데이터 업데이트

`data/contract_records.json`에 새 견적 데이터 추가:

```json
{
  "company": "회사명",
  "qty": 2000,
  "discount_pct": 60,
  "unit_price": 2000
}
```

## 기술 스택

- Next.js 14 (App Router)
- Tailwind CSS
- Recharts (차트)
- TypeScript
