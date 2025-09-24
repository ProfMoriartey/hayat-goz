// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Routes that should NOT get a locale prefix
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isAuthRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sign-out(.*)",
  "/api(.*)"
]);

const intlMiddleware = createIntlMiddleware(routing);

export default clerkMiddleware(async (auth, req) => {
  // ✅ Skip next-intl for /admin and /sign-in|up|out routes
  if (!isAdminRoute(req) && !isAuthRoute(req)) {
    const intlResponse = intlMiddleware(req);
    if (intlResponse) return intlResponse;
  }

  // ✅ Protect /admin routes
  const { sessionClaims } = await auth();
  if (isAdminRoute(req) && sessionClaims?.metadata?.role !== "admin") {
    const url = new URL("/sign-in", req.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)", // all app routes except static
    "/(api|trpc)(.*)",        // APIs
  ],
};


// // src/middleware.ts
// import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
// import { NextResponse } from "next/server";
// import createIntlMiddleware from "next-intl/middleware";
// import { routing } from "./i18n/routing";

// const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
// const intlMiddleware = createIntlMiddleware(routing);

// export default clerkMiddleware(async (auth, req) => {
//   // ✅ Skip next-intl for admin routes
//   if (!isAdminRoute(req)) {
//     const intlResponse = intlMiddleware(req);
//     if (intlResponse) return intlResponse;
//   }

//   // ✅ Protect admin routes with Clerk
//   const { sessionClaims } = await auth();
//   if (isAdminRoute(req) && sessionClaims?.metadata?.role !== "admin") {
//     const url = new URL("/sign-in", req.url);
//     return NextResponse.redirect(url);
//   }

//   return NextResponse.next();
// });

// export const config = {
//   matcher: [
//     "/((?!_next|.*\\..*).*)", // all app routes except static
//     "/(api|trpc)(.*)",        // APIs
//   ],
// };
