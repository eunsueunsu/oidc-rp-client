import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
    const cookieStore = await cookies();
    const loginCookie = cookieStore.get("sp_login");

    // 로그인 안되어 있으면 login API
    if (!loginCookie) {
        redirect("/api/login");
    }

    let user = null;

    try {
        user = JSON.parse(loginCookie.value);
    } catch (e) {
        redirect("/api/login");
    }

    return (
        <div style={container}>
            <div style={card}>
                <h2>로그인 성공</h2>
                <p>{user?.email}</p>
            </div>
        </div>
    );
}

const container: React.CSSProperties = {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f5f5f5",
};

const card: React.CSSProperties = {
    width: "320px",
    padding: "40px",
    borderRadius: "12px",
    background: "white",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
    textAlign: "center",
    fontSize: "20px",
    fontWeight: "600",
};

// export default function Page() {
//     return <div>root page</div>;
// }