import { createPagesFunctionHandler } from "@remix-run/cloudflare-pages";
import { createCloudflareKVSessionStorage } from "@remix-run/cloudflare-pages";

// @ts-ignore
import * as build from "../build";

const handleRequest = createPagesFunctionHandler({
    build,
    getLoadContext: (context) => {
        return {
            ...context,
            sessionStorage: createCloudflareKVSessionStorage({
                kv: context.env.OVO_KV,
                cookie: {
                    name: "__OvOsession",
                    httpOnly: true,
                    maxAge: 60 * 30,
                    sameSite: true,
                    secrets: [context.env.COOKIE_SECRET],
                    secure: true,
                },
            }),
        };
    },
});

export function onRequest(context) {
    return handleRequest(context);
}
