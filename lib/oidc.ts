import crypto from "crypto";

export function base64url(input: Buffer) {
    return input
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}

export function randomString(bytes = 32) {
    return base64url(crypto.randomBytes(bytes));
}

export function createPkce() {
    const code_verifier = randomString(32);
    const hash = crypto.createHash("sha256").update(code_verifier).digest();
    const code_challenge = base64url(hash);
    return { code_verifier, code_challenge, code_challenge_method: "S256" as const };
}

export function createStateNonce() {
    return { state: randomString(16), nonce: randomString(16) };
}
