# oidc sp client server

### oidc 테스트를 위한 sp mock client

- oidc idp와 테스트할 수 있는 sp client 입니다.
- sp의 로그인 유지는 쿠키의 access token으로 임시구현 되어있습니다.


### SP 설정 방법
root 경로에 .env.local 파일 설정을 추가합니다.

```
OIDC_ISSUER=http://
OIDC_CLIENT_ID=demo-client
OIDC_CLIENT_SECRET=your_client_secret
OIDC_REDIRECT_URI=http://localhost:3000/callback
NEXT_PUBLIC_OIDC_ISSUER=http://
SESSION_SECRET=dev-secret-key-at-least-32-characters-long

```

1. issuer 를 oidc idp domain으로 설정한다.
2. clinet id, client secret은 미리 oidc idp에서 등록, 발급받아 설정한다.
3. session_secret은 수정하지 않아도됨.
- npm run dev로 로컬에서 실행하여 테스트 할 수 있습니다. 
- 프로젝트 실행 방법은 아래의 next readme 참조
---



This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
