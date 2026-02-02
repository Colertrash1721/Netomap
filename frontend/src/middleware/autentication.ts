import { NextResponse, type NextRequest } from "next/server";

export function autenticación(req: NextRequest) {
    const token = req.cookies.get('token')?.value;
    if (!token) {
        return NextResponse.redirect(new URL('/', req.url))
    }
    return NextResponse.next()
}