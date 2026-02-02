import { NextRequest, NextResponse } from "next/server";
import { autenticación } from "./middleware/autentication";

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/tracking_view')) {
    return autenticación(req)
  }
  return NextResponse.next()
}
