"use client"
import {useEffect, useMemo, useState} from "react";
import LoginClient from "@/app/LoginClient";
import {discover} from "@/lib/oidcClient";

export default function Home({isLoggedIn}: { isLoggedIn: boolean }) {

    const [userinfo, setUserinfo] = useState<any>(null);
    const [userinfoErr, setUserinfoErr] = useState<string | null>(null);

    const issuer = process.env.NEXT_PUBLIC_OIDC_ISSUER || "(not set)";
    const [latest, setLatest] = useState<any>(null);
    const [err, setErr] = useState<string | null>(null);

    const discoveryUrl = useMemo(() => {
        if (!issuer || issuer === "(not set)") return null;
        return issuer.replace(/\/$/, "") + "/.well-known/openid-configuration";
    }, [issuer]);

    const jwksUrl = useMemo(() => {
        // discovery에서 jwks_uri를 읽는게 원칙이지만,
        // MVP에서는 issuer/jwks 패턴을 쓰는 경우가 많아서 둘 다 지원하도록 만들 수 있음.
        if (!issuer || issuer === "(not set)") return null;
        return issuer.replace(/\/$/, "") + "/jwks";
    }, [issuer]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem("oidc_last_result");
            if (raw) setLatest(JSON.parse(raw));


        } catch (e: any) {
            setErr("최근 결과를 불러오지 못했어요.");
        }
    }, []);
    const handleFetchUserinfo = async () => {
        setUserinfoErr(null);

        try {
            const res = await fetch("/api/userinfo", {
                credentials: "include",
            });

            if (!res.ok) {
                const t = await res.text();
                throw new Error(t);
            }

            const json = await res.json();
            setUserinfo(json);
        } catch (e: any) {
            setUserinfoErr("userinfo 호출 실패");
        }
    };

    const clearLatest = () => {
        localStorage.removeItem("oidc_last_result");
        setLatest(null);
    };
    const handleLogout = async () => {
        // 1️⃣ RP(Next) 세션 삭제
        await fetch("/api/logout", {
            method: "POST",
            credentials: "include",
        });

        // 2️⃣ IdP 로그아웃으로 이동
        const idTokenHint = latest?.id_token; // 디버그용이면 localStorage에서도 OK
        // const postLogoutRedirectUri = window.location.origin;
        const postLogoutRedirectUri = "http://localhost:3000";

        window.location.href =
            `${issuer}/logout` +
            `?id_token_hint=${encodeURIComponent(idTokenHint)}` +
            `&post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirectUri)}`;


        console.log('[api call] idp /logout ' + `${issuer}/logout` +
            `?id_token_hint=${encodeURIComponent(idTokenHint)}` +
            `&post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirectUri)}`)
    };

    return (
        <main className="min-h-screen bg-white text-black flex items-center justify-center px-4 py-10">
            <div
                className="w-full max-w-2xl rounded-2xl border border-black/15 bg-white shadow-[0_12px_50px_rgba(0,0,0,0.08)] p-8 sm:p-10">
                <div className="text-center">
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                        OIDC SP
                    </h1>
                    <p className="mt-3 text-sm sm:text-base text-black/60">
                        Debug RP • Authorization Code + PKCE + State + Nonce
                    </p>
                </div>
                <div>

                </div>
                {/* Login Button */}

                <div className="mt-10">
                    <div>
                        <LoginClient
                            isLoggedIn={isLoggedIn}
                            onLogout={isLoggedIn ? handleLogout : undefined}
                        />
                    </div>

                    <a
                        href="/login"
                        className="group w-full inline-flex items-center justify-center rounded-xl border border-black bg-black px-5 py-3 text-base font-semibold text-white transition-all duration-200 hover:bg-white hover:text-black hover:shadow-[0_10px_30px_rgba(0,0,0,0.12)] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                    >
                        로그인
                        <span
                            className="ml-2 inline-block transition-transform duration-200 group-hover:translate-x-0.5">
              →
            </span>
                    </a>

                    {/* Links */}
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <a
                            href={discoveryUrl || "#"}
                            target="_blank"
                            rel="noreferrer"
                            className={`inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium transition
              ${discoveryUrl ? "border-black/20 hover:border-black hover:bg-black hover:text-white" : "border-black/10 text-black/30 cursor-not-allowed"}`}
                        >
                            Discovery 보기
                        </a>

                        <a
                            href={jwksUrl || "#"}
                            target="_blank"
                            rel="noreferrer"
                            className={`inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium transition
              ${jwksUrl ? "border-black/20 hover:border-black hover:bg-black hover:text-white" : "border-black/10 text-black/30 cursor-not-allowed"}`}
                        >
                            JWKS 보기
                        </a>

                        <a
                            href="#latest"
                            className="inline-flex items-center justify-center rounded-xl border border-black/20 px-4 py-2 text-sm font-medium transition hover:border-black hover:bg-black hover:text-white"
                        >
                            Token 결과 보기
                        </a>
                    </div>

                    {/* Issuer */}
                    <div className="mt-6 rounded-xl border border-black/10 bg-black/[0.02] px-4 py-3">
                        <div className="text-xs font-semibold text-black/60">Current Issuer</div>
                        <div className="mt-1 text-sm font-mono break-all">{issuer}</div>
                        <div className="mt-2 text-xs text-black/50">
                            issuer는 <span className="font-mono">NEXT_PUBLIC_OIDC_ISSUER</span> 환경변수에서 읽어요.
                        </div>
                    </div>
                </div>

                {/* Latest Result */}
                <div id="latest" className="mt-10">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-lg font-bold tracking-tight">Latest Response</h2>

                        <button
                            onClick={clearLatest}
                            className="rounded-lg border border-black/20 px-3 py-1.5 text-xs font-semibold transition hover:bg-black hover:text-white"
                        >
                            Clear
                        </button>
                    </div>

                    <p className="mt-2 text-sm text-black/60">
                        마지막 로그인 콜백 결과(id_token 검증 결과 포함)를 여기서 바로 확인할 수 있어요.
                    </p>

                    <div className="mt-4 rounded-2xl border border-black/15 bg-white">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-black/10">
                            <div className="text-xs font-semibold text-black/60">response.json</div>
                            <div className="text-xs text-black/40">
                                {latest ? "localStorage: oidc_last_result" : "no data"}
                            </div>
                        </div>

                        <pre className="max-h-[380px] overflow-auto px-4 py-4 text-xs leading-relaxed font-mono">
{err ? `ERROR: ${err}`
    : latest ? JSON.stringify(latest, null, 2)
        : `아직 결과가 없어요.
1) [로그인] 버튼 클릭
2) 인증서버 로그인
3) 콜백 완료 후 Home으로 돌아오면 결과가 자동으로 표시돼요.`}
            </pre>
                    </div>
                </div>

                {isLoggedIn && (
                    <div className="mt-6">
                        <button
                            onClick={handleFetchUserinfo}
                            className="w-full rounded-xl border border-black px-5 py-3 text-sm font-semibold transition
                 hover:bg-black hover:text-white"
                        >
                            UserInfo 조회
                        </button>
                    </div>
                )}

                {userinfo && (
                    <div className="mt-6 rounded-2xl border border-black/15 bg-white">
                        <div className="px-4 py-3 border-b border-black/10 text-xs font-semibold">
                            UserInfo Response
                        </div>
                        <pre className="px-4 py-4 text-xs font-mono overflow-auto">
      {JSON.stringify(userinfo, null, 2)}
    </pre>
                    </div>
                )}

                {userinfoErr && (
                    <div className="mt-4 text-sm text-red-600">{userinfoErr}</div>
                )}
                {/* Footer */}
                <div className="mt-10 text-center text-xs text-black/45">
                    eunsu lee 🐶 • OIDC Debug Client
                </div>
            </div>
        </main>
    );
}
