import { isBefore } from "date-fns";
import { decodeJwt } from "jose";

export async function decodeAndValidateToken(
    context: any,
    request: Request,
    token?: string
) {
    if (token) {
        const payload = decodeJwt(token);

        if (payload.aud !== "OvO") {
            return null;
        }

        if (payload.exp) {
            if (!isBefore(new Date(), new Date(payload.exp * 1000))) {
                return null;
            }
        }

        return payload;
    } else {
        const session = await context.sessionStorage.getSession(
            request.headers.get("Cookie")
        );

        token = session.get("token");

        if (token) {
            const payload = decodeJwt(token);

            if (payload.aud !== "OvO") {
                return null;
            }

            if (payload.exp) {
                if (!isBefore(new Date(), new Date(payload.exp * 1000))) {
                    return null;
                }
            }

            return payload;
        } else {
            return null;
        }
    }
}

export async function hasActiveSession(
    context: any,
    request: Request
): Promise<boolean> {
    const validToken = await decodeAndValidateToken(context, request);

    if (validToken) {
        return true;
    }

    return false;
}
