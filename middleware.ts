import { NextRequest, NextResponse } from "next/server";

// Modusign 내부 전용 — 공유 비밀번호로 접근 제한.
// APP_PASSWORD가 설정되지 않으면(로컬 개발 등) 보호를 건너뛴다.
export function middleware(req: NextRequest) {
  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) return NextResponse.next();

  const auth = req.headers.get("authorization");
  if (auth) {
    const [scheme, encoded] = auth.split(" ");
    if (scheme === "Basic" && encoded) {
      const decoded = Buffer.from(encoded, "base64").toString("utf-8");
      const [, password] = decoded.split(":");
      if (password === appPassword) {
        return NextResponse.next();
      }
    }
  }

  return new NextResponse("인증이 필요합니다", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="quote-generator"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
