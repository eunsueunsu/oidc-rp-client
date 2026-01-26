// app/page.tsx
import { headers, cookies} from "next/headers";
import HomeClient from "./HomeClient";

export default async function Page() {

  const cookieStore = await cookies();

  const spSession = cookieStore.get('sp_login');

  // const cookieHeader = headers().get("cookie") || "";
  // const spSession = cookieHeader.includes("sp_session=");

  const isLoggedIn = Boolean(spSession);
  console.log(isLoggedIn)
  console.log(spSession)

  return <HomeClient isLoggedIn={isLoggedIn} />;
}
