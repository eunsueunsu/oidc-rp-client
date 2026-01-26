import { jwtVerify, createRemoteJWKSet } from "jose";

type Discovery = {
    issuer: string;
    authorization_endpoint: string;
    token_endpoint: string;
    jwks_uri: string;
    userinfo_endpoint?: string;
};

// discover api 호출
export async function discover(issuer: string): Promise<Discovery> {
    const url = issuer.replace(/\/$/, "") + "/.well-known/openid-configuration";
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Discovery failed: ${res.status}`);

    console.log('[api call] idp /discover '+ url )
    return res.json();
}

export async function exchangeCodeForToken(params: {
    token_endpoint: string;
    client_id: string;
    client_secret?: string;
    redirect_uri: string;
    code: string;
    code_verifier: string;
}) {
    const body = new URLSearchParams();
    body.set("grant_type", "authorization_code");
    body.set("client_id", params.client_id);
    body.set("redirect_uri", params.redirect_uri);
    body.set("code", params.code);
    body.set("code_verifier", params.code_verifier);
    if (params.client_secret) body.set("client_secret", params.client_secret);

    // ✅ 디버깅 출력
    console.log("[TOKEN] POST", params.token_endpoint);
    console.log("[TOKEN] body =", body.toString());


    // 받은 토큰으로 token api 호출
    let res: Response;
    try {
        res = await fetch(params.token_endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: body.toString(),
            cache: "no-store",
        });

        console.log('[api call] idp /token '+ res )

    } catch (e: any) {
        console.error("[TOKEN] fetch failed", e?.message || e);
        throw e;
    }

    const text = await res.text();
    console.log("[TOKEN] status =", res.status);
    console.log("[TOKEN] response =", text);

    let json: any;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }

    if (!res.ok) {
        // ✅ 여기서 에러를 상세히 던지기
        throw new Error(`Token exchange failed: ${res.status} ${JSON.stringify(json)}`);
    }
    console.log('[api call] idp /token '+ json )

    return json;

}

export async function verifyIdToken(params: {
    issuer: string;
    jwks_uri: string;
    client_id: string;
    id_token: string;
    expected_nonce?: string;
}) {
    console.log(params)
    // jwks api 호출
    const JWKS = createRemoteJWKSet(new URL(params.jwks_uri));
    const { payload, protectedHeader } = await jwtVerify(params.id_token, JWKS, {
        issuer: params.issuer,
        audience: params.client_id,
    });
    console.log('[api call] idp /jwks '+ JWKS )
    console.log('payload : '+payload.nonce)

    console.log(params)
    // nonce 검증
    // if (params.expected_nonce && payload.nonce !== params.expected_nonce) {
    //     throw new Error(`nonce mismatch expected=${params.expected_nonce}, got=${payload.nonce}`);
    // }

    return { payload, protectedHeader };
}


export async function refreshAccessToken(params: {
    token_endpoint: string;
    client_id: string;
    client_secret?: string;
    refresh_token: string;
}) {
    const body = new URLSearchParams();
    body.set("grant_type", "refresh_token");
    body.set("client_id", params.client_id);
    body.set("refresh_token", params.refresh_token);

    if (params.client_secret) {
        body.set("client_secret", params.client_secret);
    }

    const res = await fetch(params.token_endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
        cache: "no-store",
    });
    console.log(res)
    console.log('[api call] idp /token granttype - refresh')
    const text = await res.text();
    let json: any;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }

    if (!res.ok) {
        throw new Error(`refresh failed: ${res.status} ${JSON.stringify(json)}`);
    }

    return json;
}
