import { getIronSession, IronSessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
    user?: {
        sub: string;
        email?: string;
        name?: string;
        preferred_username?: string;
        iss: string;
        aud: string | string[];
    };
}

export const sessionOptions: IronSessionOptions = {
    password: process.env.SESSION_SECRET as string,
    cookieName: "oidc_rp_session",
    cookieOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    },
};

export async function getSession() {
    // ✅ App Router에서 정상 동작하는 형태
    return getIronSession<SessionData>(cookies(), sessionOptions);
}
