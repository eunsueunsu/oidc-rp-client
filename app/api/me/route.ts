import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const cookie = req.cookies.get("sp_login");

    if (!cookie) {
        return NextResponse.json({ user: null });
    }

    return NextResponse.json({
        user: JSON.parse(cookie.value),
    });
}
