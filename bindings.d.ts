export {};

declare global {
    const JWT_SECRET: string;
    const COOKIE_SECRET: string;
    const OVO_TOKEN_SERVICE: string;
    const OVO_KV: KVNamespace;
}
