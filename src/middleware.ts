
import { auth } from "@/auth"

export default auth((req: any) => {
    if (!req.auth && req.nextUrl.pathname !== "/login" && req.nextUrl.pathname !== "/signup") {
        // Basic protection for now. 
        // Auth js v5 middleware logic matches routes automatically via config
    }
})

export const config = {
    // Protect specific routes
    matcher: [
        "/finance/:path*",
        "/ads/:path*",
        "/acquisition/:path*",
        "/products/:path*",
        "/alerts/:path*",
        "/timeline/:path*",
        "/reports/:path*",
        "/connections/:path*",
        "/settings/:path*",
        "/account/:path*" // New Account area
    ],
}
