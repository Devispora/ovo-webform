import { createCookieSessionStorage, SessionStorage } from "remix";
import { decodeJwt } from "jose";

export function decodeAndPartiallyValidateToken(token: string) {
    const payload = decodeJwt(token);

    if (payload.aud !== "OvO") {
        return null;
    }

    return payload;
}

export async function hasActiveSession(
    context,
    request: Request
): Promise<boolean> {
    const session = await context.sessionStorage.getSession(
        request.headers.get("Cookie")
    );

    const token: string = session.get("token");

    if (token) {
        const validToken = await decodeAndPartiallyValidateToken(token);

        if (validToken) {
            return true;
        }
    }

    return false;
}
