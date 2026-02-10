import { NextResponse } from "next/server";
import { checkAuth } from "./actions/authActions";

export async function  proxy(request) {
  const token = request.cookies.get("session_token")?.value;

  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    const res = await checkAuth()
    if (!res.success) {
        return NextResponse.redirect(new URL("/", request.url));
      }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
