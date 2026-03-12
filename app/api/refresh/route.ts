// app/api/refresh/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { discover, refreshAccessToken } from "@/lib/oidcClient";
import {redirect} from "next/navigation";
import {createPkce, createStateNonce} from "@/lib/oidc";

function decodeJwt(token: string) {
    const payload = token.split(".")[1];
    const decoded = Buffer.from(payload, "base64url").toString("utf-8");
    return JSON.parse(decoded);
}
export async function POST() {
    const cookieStore = await cookies();

    const refreshToken = cookieStore.get("refresh_token");
    // Refresh token replay test
    const spLogin = cookieStore.get("sp_login");

    if ( !refreshToken?.value) {
    // if (!spLogin || !refreshToken?.value) {
        return NextResponse.json(
            { error: "no_refresh_token" },
            { status: 401 }
        );
    }

    try {

            const issuer = process.env.OIDC_ISSUER!;
            const clientId = process.env.OIDC_CLIENT_ID!;
            const clientSecret = process.env.OIDC_CLIENT_SECRET;

        const d = await discover(issuer);

        if (!d.token_endpoint) {
            return NextResponse.json(
                { error: "no_token_endpoint" },
                { status: 500 }
            );
        }

        const refreshed = await refreshAccessToken({
            token_endpoint: d.token_endpoint,
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken.value,
            // refresh_token : "t4tVHNI7yKs6FjuK4Eeqzl3rUVa6FZs5zA4rpthNG2Y"

        });

        // 🔐 access_token
        // const accessPayload = decodeJwt(refreshed.access_token);
        // 🔐 쿠키 갱신
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
        // ✅ sp_login은 값 유지 + maxAge만 연장
        if (spLogin?.value) {
            cookieStore.set("sp_login", spLogin.value, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: 60 * 10, // 예: 10분 (원하는 idle TTL로 설정)
            });
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("refresh failed:", e);

        // const issuer = process.env.OIDC_ISSUER!;
        // const clientId = process.env.OIDC_CLIENT_ID!;
        // const redirectUri = process.env.OIDC_REDIRECT_URI!;
        //
        // // const { code_verifier, code_challenge, code_challenge_method } = createPkce();
        // // const { state, nonce } = createStateNonce();
        //
        // const authorizeUrl =
        //     `${issuer}/oidc` +
        //     `?response_type=code` +
        //     `&client_id=${encodeURIComponent(clientId)}` +
        //     `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        //     // `&state=${state}` +
        //     // `&code_challenge=${code_challenge}` +
        //     // `&code_challenge_method=${code_challenge_method}` +
        //     // `&nonce=${nonce}` +
        //     `&scope=openid profile email`;

        return NextResponse.json(
            {
                error: "refresh_failed",
                // redirect: authorizeUrl,
            },
            { status: 401 }
        );
    }
}
