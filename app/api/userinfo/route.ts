// app/api/userinfo/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {discover, refreshAccessToken} from "@/lib/oidcClient";

export async function GET() {
    const cookieStore = await cookies();

    // 🔐 SP 세션 확인
    const spLogin = cookieStore.get("sp_login");
    const accessToken = cookieStore.get("access_token"); // 있으면

    if (!spLogin || !accessToken) {
        return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }

    const issuer = process.env.OIDC_ISSUER!;
    //

    // Userinfo 엔드포인트 검색후 가져가게함
    const d = await discover(issuer);
    console.log(d.userinfo_endpoint)
    const userInfo = new URL(d.userinfo_endpoint);
    const userinfoEndpoint = `${issuer}/userinfo`;

    const res = await fetch(userInfo, {
        headers: {
            Authorization: `Bearer ${accessToken.value}`,
        },
        cache: "no-store",
    });
    console.log(res)
    // 2️⃣ access_token 만료 → refresh 시도
    if (res.status === 200) {
        const clientId = process.env.OIDC_CLIENT_ID!;
        const clientSecret = process.env.OIDC_CLIENT_SECRET;
        // TODD : 임시 Refresh 구현
        const refreshToken = cookieStore.get("refresh_token"); // 있으면

        console.log(refreshToken)
        try {
            const refreshed = await refreshAccessToken({
                token_endpoint: d.token_endpoint,
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: refreshToken.value,
            });

            // 3️⃣ 쿠키 갱신
            cookieStore.set("access_token", refreshed.access_token, {
                httpOnly: true,
                sameSite: "lax",
                secure: true,
                path: "/",
            });

            if (refreshed.refresh_token) {
                cookieStore.set("refresh_token", refreshed.refresh_token, {
                    httpOnly: true,
                    sameSite: "lax",
                    secure: true,
                    path: "/",
                });
            }

            const res = await fetch(userInfo, {
                headers: {
                    Authorization: `Bearer ${accessToken.value}`,
                },
                cache: "no-store",
            });
        } catch (e) {
            return NextResponse.json(
                {error: "refresh_failed"},
                {status: 401}
            );
        }
    }
    if (!res.ok) {
        return NextResponse.json(
            { error: "userinfo_failed", status: res.status },
            { status: 500 }
        );
    }

    const userinfo = await res.json();

    console.log('[api call] idp /userinfo  by accesstoken  res : '+ userinfo )

    return NextResponse.json(userinfo);
}
