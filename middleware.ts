// middleware.ts — Proteção de rotas
// Coloque este arquivo na RAIZ do projeto (mesma pasta do package.json)

import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas públicas — não precisam de login
  const publicRoutes = ["/", "/onboarding"];
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Criar resposta base
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Criar cliente Supabase para o middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Verificar sessão
  const { data: { user } } = await supabase.auth.getUser();

  // Se não está logado e tenta acessar rota protegida → redireciona para login
  if (!user && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Se está logado e tenta acessar a página de login → redireciona para dashboard
  if (user && pathname === "/") {
    // Verificar se já fez onboarding
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("onboarding_ok")
      .eq("id", user.id)
      .single();

    if (!profile?.onboarding_ok) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Se está logado, tenta acessar onboarding mas já completou → vai para dashboard
  if (user && pathname === "/onboarding") {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("onboarding_ok")
      .eq("id", user.id)
      .single();

    if (profile?.onboarding_ok) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
