import {
    ErrorBoundaryComponent,
    json,
    LoaderFunction,
    redirect,
    Session,
    useCatch,
    useLoaderData,
} from "remix";
import {
    decodeAndValidateToken,
    exchangeCode,
} from "~/services/session.server";
import { ArrowCircleRightIcon } from "@heroicons/react/solid";

export const loader: LoaderFunction = async ({ request, context }) => {
    try {
        const { getSession, commitSession } = context.sessionStorage;
        const session: Session = await getSession(
            request.headers.get("Cookie")
        );

        let loggedIn = false;

        const url = new URL(request.url);

        const code = url.searchParams.get("code");

        const existingToken = await decodeAndValidateToken(context, request);

        if (existingToken) {
            if (code && existingToken.ovo_claims?.redeem_code !== code) {
                const exchange = await exchangeCode(
                    context.env.OVO_TOKEN_SERVICE as string,
                    code
                );

                if (exchange?.token) {
                    session.set("token", exchange.token);
                } else if (exchange?.error) {
                    return json({
                        error: exchange.error.name,
                        channel: context.env.RESERVATION_CHANNEL,
                    });
                }
            }

            loggedIn = true;
        } else if (code) {
            const exchange = await exchangeCode(
                context.env.OVO_TOKEN_SERVICE as string,
                code
            );

            if (exchange?.token) {
                session.set("token", exchange.token);

                loggedIn = true;
            } else if (exchange?.error) {
                return json({
                    error: exchange.error.name,
                    channel: context.env.RESERVATION_CHANNEL,
                });
            }
        }

        if (loggedIn) {
            return redirect("/reserve/new", {
                headers: {
                    "Set-Cookie": await commitSession(session),
                },
            });
        }

        return json({
            channel: context.env.RESERVATION_CHANNEL,
        });
    } catch (err) {
        context.sentry.captureException(err);
        throw err;
    }
};

export default function Reserve() {
    const { error, channel } =
        useLoaderData<{ error?: string; channel: string }>();

    let friendlyError = "";

    if (error) {
        if (error === "CodeNoLongerValid") {
            friendlyError = "Code is either invalid or has expired";
        }
    }

    return (
        <div className="container mx-auto grid h-screen w-full place-content-center">
            <h1 className="text-xl ">You need to provide an access code!</h1>
            <form className="">
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Access Code:</span>
                    </label>
                    <div className="input-group">
                        <input
                            name="code"
                            type="text"
                            required
                            placeholder="Code..."
                            className="input input-bordered"
                        />
                        <button
                            type="submit"
                            className="btn btn-primary btn-square"
                        >
                            <ArrowCircleRightIcon className="h-5 w-5" />
                        </button>
                    </div>
                    {error ? (
                        <p className="text-xs text-red-400">{friendlyError}</p>
                    ) : null}
                    <p className="mt-1 text-sm font-light text-gray-600">
                        You can get one{" "}
                        <a
                            target="_blank"
                            className="text-blue-600 underline visited:text-purple-600 hover:text-blue-800"
                            href={channel}
                        >
                            here
                        </a>
                    </p>
                </div>
            </form>
        </div>
    );
}

export function CatchBoundary() {
    const caught = useCatch();
}

export const ErrorBoundary: ErrorBoundaryComponent = ({ error }) => {
    return (
        <div className="m-auto grid h-screen w-screen place-content-center">
            <p className="text-9xl font-extrabold text-red-900">
                An error has occurred!
            </p>
            <p className="text-lg font-semibold">
                Please try again. If the service continues to have issues,
                please contact an OvO Admin.
            </p>
        </div>
    );
};
