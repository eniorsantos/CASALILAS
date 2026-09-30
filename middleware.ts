import { auth } from "@/auth";
import { NextResponse } from "next/server";

/** Origens liberadas p/ as rotas /api/mobile/* (painel Vite, previews). */
function allowedOrigin(req: Request): string | null {
  const origin = req.headers.get("origin");
  if (!origin) return null;
  const allowlist = (process.env.CORS_ORIGINS ?? "http://localhost:5173").split(",");
  return allowlist.includes(origin) ? origin : null;
}

function corsHeaders(req: Request): Headers {
  const headers = new Headers();
  const origin = allowedOrigin(req);
  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }
  headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return headers;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // CORS das rotas mobile (o app Vite roda em outra origem).
  if (pathname.startsWith("/api/mobile")) {
    if (req.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
    }
    const res = NextResponse.next();
    corsHeaders(req).forEach((v, k) => res.headers.set(k, v));
    return res;
  }

  const isLoggedIn = !!req.auth;
  const userRole = (req.auth?.user as { role?: string } | undefined)?.role;

  const isAdminRoute = pathname.startsWith("/admin");
  const isProtectedStudentRoute =
    pathname.startsWith("/meus-cursos") || pathname.startsWith("/curso/");
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/cadastro");

  if (isAdminRoute && (!isLoggedIn || !["ADMIN", "INSTRUCTOR"].includes(userRole ?? ""))) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isProtectedStudentRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/meus-cursos", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/meus-cursos/:path*",
    "/curso/:path*",
    "/login",
    "/cadastro",
    "/api/mobile/:path*",
  ],
};
