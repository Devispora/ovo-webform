import {
    ErrorBoundaryComponent,
    json,
    LoaderFunction,
    redirect,
    useCatch,
    useLoaderData,
} from "remix";
import { decodeAndValidateToken } from "~/services/session.server";
import { ArrowCircleRightIcon } from "@heroicons/react/solid";

interface TokenResponse {
    error?: { [errorName: string]: string };
    result?: {
        jwt: string;
    };
}

export const loader: LoaderFunction = async ({ request, context }) => {
    try {
        const { getSession, commitSession } = context.sessionStorage;
        const session = await getSession(request.headers.get("Cookie"));

        let loggedIn = false;

        const token: string = session.get("token");

        const url = new URL(request.url);

        if (await decodeAndValidateToken(context, request, token)) {
            loggedIn = true;
        } else {
            const code = url.searchParams.get("code");

            if (code) {
                try {
                    const response = await fetch(
                        context.env.OVO_TOKEN_SERVICE as string,
                        {
                            method: "POST",
                            body: JSON.stringify({
                                code,
                            }),
                        }
                    );

                    const resBody: TokenResponse = await response.json();

                    session.set("token", resBody.result?.jwt);

                    loggedIn = true;
                } catch (err) {
                    console.log(err);
                }
            }
        }

        if (loggedIn) {
            return redirect("/reserve/new", {
                headers: {
                    "Set-Cookie": await commitSession(session),
                },
            });
        }

        const reason = url.searchParams.get("reason");

        return json({
            reason: reason ? reason : "access",
            channel: context.env.RESERVATION_CHANNEL,
        });
    } catch (err) {
        context.sentry.captureException(err);
        throw err;
    }
};

export default function Reserve() {
    const { reason, channel } =
        useLoaderData<{ reason: string; channel: string }>();

    return (
        <div className="container mx-auto grid h-screen w-full place-content-center">
            <h1 className="text-xl ">You need to provide your access code!</h1>
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
                please contact a PSB Admin.
            </p>
        </div>
    );
};
