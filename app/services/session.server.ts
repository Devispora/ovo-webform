import { isBefore } from "date-fns";
import { decodeJwt, JWTPayload } from "jose";

export type OvOClaims = {
    token_id: string;
    redeem_code: string;
    groups: string[];
};

export type JWTOvOPayload = {
    ovo_claims?: OvOClaims;
};

export async function decodeAndValidateToken(
    context: any,
    request: Request,
    token?: string
): Promise<(JWTPayload & JWTOvOPayload) | null> {
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

export interface TokenResponse {
    error?: { [errorName: string]: string };
    result?: {
        jwt: string;
    };
}

export async function exchangeCode(tokenService: string, code: string) {
    const response = await fetch(tokenService, {
        method: "POST",
        body: JSON.stringify({
            code,
        }),
    });

    const resBody: TokenResponse = await response.json();

    if (resBody.result) {
        return { token: resBody.result.jwt };
    } else if (resBody.error) {
        return {
            error: {
                name: Object.keys(resBody.error)[0],
                value: Object.values(resBody.error)[0],
            },
        };
    }
}
