import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)", "/api/workout/summary"]);

export default clerkMiddleware(async (auth, request) => {
    if (!isPublicRoute(request)) {
        // Sem unauthenticatedUrl, auth.protect() renderiza um 404 (not-found)
        // pra quem não tem sessão, em vez de mandar pro /sign-in — era a causa
        // real do /dashboard 404 (x-clerk-auth-reason: protect-rewrite).
        await auth.protect({ unauthenticatedUrl: new URL("/sign-in", request.url).toString() });
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js|json|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
