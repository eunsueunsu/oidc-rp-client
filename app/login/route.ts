import { NextResponse } from "next/server";
import { createPkce, createStateNonce } from "../../lib/oidc";
import { discover } from "../../lib/oidcClient";

export async function GET() {
    const issuer = process.env.OIDC_ISSUER!;
    const client_id = process.env.OIDC_CLIENT_ID!;
    const redirect_uri = process.env.OIDC_REDIRECT_URI!;

    const d = await discover(issuer);

    const { code_verifier, code_challenge, code_challenge_method } = createPkce();
    const { state, nonce } = createStateNonce();

    const auth = new URL(d.authorization_endpoint);
    auth.searchParams.set("response_type", "code");
    auth.searchParams.set("client_id", client_id);
    auth.searchParams.set("redirect_uri", redirect_uri);
    auth.searchParams.set("scope", "openid profile email");
    auth.searchParams.set("state", state);
    auth.searchParams.set("nonce", nonce);
    auth.searchParams.set("code_challenge", code_challenge);
    auth.searchParams.set("code_challenge_method", code_challenge_method);

    const res = NextResponse.redirect(auth.toString());

    console.log('[api call] sp /login -> idp /authorize redirect  res : '+ res )
    // // ✅ 쿠키는 response에 설정해야 함

    // “이 브라우저가 시작한 이 로그인 시도 1건의
    // 모든 보안 파라미터를
    // 브라우저 쿠키에 고정시킨다
    // 현재 로그인 시도에 유지시키기 위해 쿠키에 약식으로 붙여놓음.  sp에서는 아래의 값을 따로 적재하고 관리해야함
    res.cookies.set("pkce_verifier", code_verifier, { httpOnly: true, sameSite: "lax", path: "/" });
    res.cookies.set("oidc_state", state, { httpOnly: true, sameSite: "lax", path: "/" });
    res.cookies.set("oidc_nonce", nonce, { httpOnly: true, sameSite: "lax", path: "/" });
    res.cookies.set("oidc_issuer", issuer, { httpOnly: true, sameSite: "lax", path: "/" });

    return res;
}
