export async function fetchWithAuth(
    input: RequestInfo | URL,
    init?: RequestInit
) {
    // 1️⃣ 최초 요청
    let res = await fetch(input, {
        ...init,
        credentials: "include",
    });

    if (res.status !== 401) {
        return res;
    }

    // 2️⃣ access_token 만료 → refresh 시도
    const refreshRes = await fetch("/api/refresh", {
        method: "POST",
        credentials: "include",
    });

    // 🔥 refresh 실패
    if (!refreshRes.ok) {
        const data = await refreshRes.json().catch(() => null);

        if (data?.redirect) {
            window.location.href = data.redirect;
            return new Response(null, { status: 401 });
        }

        throw new Error("Session expired");
    }

    // 3️⃣ refresh 성공 → 원래 요청 재시도
    res = await fetch(input, {
        ...init,
        credentials: "include",
    });

    return res;
}