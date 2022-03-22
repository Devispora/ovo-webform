import { createPagesFunctionHandler } from "@remix-run/cloudflare-pages";
import { createCloudflareKVSessionStorage } from "@remix-run/cloudflare-pages";
import Toucan from "toucan-js";

// @ts-ignore
import * as build from "../build";

const handleRequest = createPagesFunctionHandler({
    build,
    getLoadContext: (context) => {
        const sentry = new Toucan({
            dsn: context.env.SENTRY_DSN,
            context: context,
            allowedHeaders: ["user-agent"],
            allowedSearchParams: /(.*)/,
        });

        return {
            ...context,
            sentry,
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
