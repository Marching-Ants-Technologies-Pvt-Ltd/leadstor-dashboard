export function decodeJwt(token: string) {
    if (!token || typeof token !== "string") {
        throw new Error("JWT token must be a non-empty string");
    }

    const parts = token.split(".");

    if (parts.length !== 3) {
        throw new Error("Invalid JWT format");
    }

    const payload = parts[1];

    try {
        // JWT uses Base64URL encoding.
        const base64 = payload
            .replace(/-/g, "+")
            .replace(/_/g, "/")
            .padEnd(Math.ceil(payload.length / 4) * 4, "=");

        const json = Buffer.from(base64, "base64").toString("utf-8");

        return JSON.parse(json);
    } catch {
        throw new Error("Unable to decode JWT payload");
    }
}