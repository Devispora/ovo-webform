import {
    Links,
    LinksFunction,
    LiveReload,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
} from "remix";
import type { MetaFunction } from "remix";
import tailwind from "./tailwind.css";

export const meta: MetaFunction = () => {
    return {
        title: "OvO Request",
    };
};

export const links: LinksFunction = () => {
    return [{ rel: "stylesheet", href: tailwind }];
};

function Document({
    children,
    title,
}: {
    children: React.ReactNode;
    title?: string;
}) {
    return (
        <html lang="en" data-theme="light">
            <head>
                <meta charSet="utf-8" />
                <Meta />
                {title ? <title>{title}</title> : null}
                <Links />
            </head>
            <body>
                {children}
                <Scripts />
                {/*Doesn't work for now - complains about process undefined
                <LiveReload/>*/}
            </body>
        </html>
    );
}

export default function App() {
    return (
        <Document title="OvO  ">
            <Outlet />
        </Document>
    );
}
