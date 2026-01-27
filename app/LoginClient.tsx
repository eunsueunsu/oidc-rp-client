// app/LoginClient.tsx
"use client";

export default function LoginClient({
                                        isLoggedIn,
                                        onLogout,
                                    }: {
    isLoggedIn: boolean;
    onLogout?: () => void;
}) {




    return (<div>
            {isLoggedIn ? (
                <div className="grid grid-cols-4 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-black/15 bg-black/[0.02] p-4 mb-6 col-span-3">

                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold ">상태 : 로그인됨</span>

                    </div>
                </div>
                    <div onClick={onLogout}
                         className=" col-span-1 mb-6 text-center items-center justify-center rounded-xl border border-black bg-black px-5 py-3 text-base font-semibold text-white transition-all duration-200 hover:bg-white hover:text-black hover:shadow-[0_10px_30px_rgba(0,0,0,0.12)] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2">
                        <span className="text-sm font-semibold">로그아웃</span>
                        {/*<button*/}
                        {/*    onClick={onLogout}*/}
                        {/*    className="rounded-lg border border-black px-3 py-1 text-xs font-semibold hover:bg-black hover:text-white"*/}
                        {/*>*/}
                        {/*    로그아웃*/}
                        {/*</button>*/}
                    </div>
                </div>
            ) : (
                <div className="rounded-xl border border-black/15 bg-black/[0.02] p-4 mb-6">

                    <span className="text-sm text-black/60">상태 : 로그인되어 있지 않습니다.</span>
                </div>
            )}
        </div>
    );
}
