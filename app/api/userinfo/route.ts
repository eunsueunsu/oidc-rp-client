// app/api/userinfo/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { discover } from "@/lib/oidcClient";

export async function GET() {
    const cookieStore = await cookies();

    const spLogin = cookieStore.get("sp_login");
    const accessToken = cookieStore.get("access_token");

    if (!spLogin || !accessToken) {
        return NextResponse.json(
            { error: "not_authenticated" },
            { status: 401 }
        );
    }

    const issuer = process.env.OIDC_ISSUER!;
    const d = await discover(issuer);

    if (!d.userinfo_endpoint) {
        return NextResponse.json(
            { error: "no_userinfo_endpoint" },
            { status: 500 }
        );
    }

    const res = await fetch(d.userinfo_endpoint, {
        headers: {
            Authorization: `Bearer ${accessToken.value}`,
        },
        cache: "no-store",
    });

    // 🔥 access 만료면 그냥 401 반환
    if (res.status === 401) {
        return NextResponse.json(
            { error: "access_expired" },
            { status: 401 }
        );
    }

    if (!res.ok) {
        return NextResponse.json(
            { error: "userinfo_failed", status: res.status },
            { status: 500 }
        );
    }

    const userinfo = await res.json();

    return NextResponse.json(userinfo);
}