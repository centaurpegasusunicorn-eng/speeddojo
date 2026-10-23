import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/*
 * Runs on the server before every page loads (Next.js "proxy", formerly
 * "middleware"). It:
 *  1. keeps the student's sign-in fresh (Supabase stores it in cookies)
 *  2. sends signed-out visitors to /login, then back where they were going
 *  3. sends signed-in visitors away from /login to their dashboard
 */

// Pages anyone can open without signing in
const PUBLIC_PATHS = [
  "/login",
  "/auth",
  "/forgot-password",
  "/api/stripe-webhook", // Stripe calls this; it checks Stripe's signature itself
];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
          // Stops a CDN caching one student's session for another
          Object.entries(headers).forEach(([key, value]) =>
            response.headers.set(key, value)
          );
        },
      },
    }
  );

  // Verifies the sign-in (and refreshes it if needed). Don't add code
  // between creating the client and this call.
  const { data } = await supabase.auth.getClaims();
  const signedIn = !!data?.claims;

  const { pathname, search } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (!signedIn && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    if (pathname !== "/") url.searchParams.set("next", pathname + search);
    return redirectKeepingCookies(url, response);
  }

  if (signedIn && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return redirectKeepingCookies(url, response);
  }

  return response;
}

// A redirect must carry over any refreshed sign-in cookies
function redirectKeepingCookies(url: URL, from: NextResponse) {
  const res = NextResponse.redirect(url);
  from.cookies.getAll().forEach((c) => res.cookies.set(c));
  from.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "set-cookie") res.headers.set(key, value);
  });
  return res;
}

export const config = {
  matcher: [
    // Everything except Next's own files and media in /public
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|mov)$).*)",
  ],
};
