import {NextRequest, NextResponse} from "next/server";
import { cookies } from "next/headers";
import { discover, exchangeCodeForToken, verifyIdToken } from "../../lib/oidcClient";
import {ReadonlyRequestCookies} from "next/dist/server/web/spec-extension/adapters/request-cookies";
import {getSession} from "@/lib/session";
import {jwtVerify} from "jose";

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const error_description = url.searchParams.get("error_description");

    console.log('[sp] call back 호출 시점. url : '+ url)

    if (error) return NextResponse.json({ error, error_description }, { status: 400 });
    if (!code || !state) return NextResponse.json({ error: "missing code/state" }, { status: 400 });


    // const c:ReadonlyRequestCookies = await cookies();
    const expectedState = req.cookies.get('oidc_state')?.value;
    const nonce = req.cookies.get("oidc_nonce")?.value;
    const code_verifier = req.cookies.get("pkce_verifier")?.value;
    const issuer = req.cookies.get("oidc_issuer")?.value || process.env.OIDC_ISSUER!;

    if (!expectedState || state !== expectedState) {
        return NextResponse.json({ error: "state mismatch", expectedState, got: state }, { status: 400 });
    }
    if (!code_verifier) {
        return NextResponse.json({ error: "missing pkce_verifier(cookie)" }, { status: 400 });
    }

    const d = await discover(issuer);
    console.log('[CALLBACK] code=', code);
    console.log('[CALLBACK] state=', state);
    console.log('[CALLBACK] issuer=', issuer);
    console.log('[CALLBACK] redirect_uri=', process.env.OIDC_REDIRECT_URI);
    console.log('[CALLBACK] client_id=', process.env.OIDC_CLIENT_ID);
    console.log('[CALLBACK] code_verifier=', code_verifier);
    console.log('[CALLBACK] token_endpoint=', d.token_endpoint);
    const token = await exchangeCodeForToken({
        token_endpoint: d.token_endpoint,
        client_id: process.env.OIDC_CLIENT_ID!,
        client_secret: process.env.OIDC_CLIENT_SECRET,
        redirect_uri: process.env.OIDC_REDIRECT_URI!,
        code,
        code_verifier,
    });

    const idTokenVerified = token.id_token
        ? await verifyIdToken({
            issuer: d.issuer,
            jwks_uri: d.jwks_uri,
            client_id: process.env.OIDC_CLIENT_ID!,
            id_token: token.id_token,
            expected_nonce: nonce,
        })
        : null;

    const result = {
        callback: { code, state },
        tokenResponse: token,
        idTokenVerified: idTokenVerified
            ? { protectedHeader: idTokenVerified.protectedHeader, payload: idTokenVerified.payload }
            : null,
        discovery: d,
    };

    // ✅ 결과 저장 + 홈으로 이동 HTML
    const html = `<!doctype html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>OIDC Callback</title></head>
<body style="font-family: ui-sans-serif, system-ui; padding:24px">
<h1>OIDC Callback</h1>
<p>Saving result to localStorage and redirecting to Home...</p>
<pre id="data" style="background:#f7f7f7;padding:12px;border:1px solid #ddd;border-radius:12px;overflow:auto"></pre>
<script>
  const data = ${JSON.stringify(result).replace(/</g, "\\u003c")};
  document.getElementById("data").textContent = JSON.stringify(data, null, 2);
  localStorage.setItem("oidc_last_result", JSON.stringify(data));
  setTimeout(() => location.href = "/", 300);
</script>
</body></html>`;


    const res = new NextResponse(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
    });
    // 2️⃣ 로그인 상태 쿠키 생성

    if (idTokenVerified) {

        // maxAge = exp - now - CLOCK_SKEW (여유시간처리)
        res.cookies.set("sp_login", JSON.stringify({
            sub: idTokenVerified.payload.sub,
            name: idTokenVerified.payload.name,
        }), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge:idTokenVerified.payload.exp -idTokenVerified.payload.iat- 30   // 한시간 -30 정도
        });

        // sp 테스트 구현용 access token 쿠키 적재

        res.cookies.set("access_token",token.access_token)

        // TODO : sample 구현을 위한 임시 리프레시 토큰 적재 ( 무조건 백엔드 DB에 저장해야 되는 데이터 )
        res.cookies.set("refresh_token",token.refresh_token)


    }
    // ✅ delete도 res.cookies로 (NextResponse cookies는 sync)
    res.cookies.delete("oidc_state");
    res.cookies.delete("oidc_nonce");
    res.cookies.delete("pkce_verifier");

    return res;
}
