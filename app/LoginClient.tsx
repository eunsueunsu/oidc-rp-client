// app/LoginClient.tsx
"use client";

export default function LoginClient({
                                        isLoggedIn,
                                        onLogout,
                                    }: {
    isLoggedIn: boolean;
    onLogout?: () => void;
}) {




    return (
        <div className="rounded-xl border border-black/15 bg-black/[0.02] p-4">
            {isLoggedIn ? (
                <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">로그인됨</span>
                    <button
                        onClick={onLogout}
                        className="rounded-lg border border-black px-3 py-1 text-xs font-semibold hover:bg-black hover:text-white"
                    >
                        로그아웃
                    </button>
                </div>
            ) : (
                <span className="text-sm text-black/60">로그인되어 있지 않습니다.</span>
            )}

        </div>
    );
}
