import { format, utcToZonedTime } from "date-fns-tz";
import {
    LoaderFunction,
    Session,
    useLoaderData,
    json,
    redirect,
    useCatch,
    ErrorBoundaryComponent,
} from "remix";
import { getBases, OvOReservation } from "~/services/bases.server";
import { Base } from "~/services/constants";
import { CheckCircleIcon } from "@heroicons/react/outline";

export const loader: LoaderFunction = async ({ request, context }) => {
    try {
        const session: Session = await context.sessionStorage.getSession(
            request.headers.get("Cookie")
        );

        const reservation = session.get("reservation");

        if (!reservation) {
            return redirect("/");
        }

        const reservations: OvOReservation[] = JSON.parse(reservation);

        const bases = getBases(
            reservations.map((reservation) => reservation.facility_id)
        );

        return json({
            channel: context.env.RESERVATION_CHANNEL,
            bases,
            reservations,
        });
    } catch (err) {
        context.sentry.captureException(err);
        throw err;
    }
};

export default function ReservationInfo() {
    const { reservations, channel, bases } = useLoaderData<{
        reservations: OvOReservation[];
        channel: string;
        bases: Base[];
    }>();

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const startTime = utcToZonedTime(
        new Date(reservations[0].start_time * 1000),
        timezone
    );

    return (
        <div className="m-auto grid h-screen w-screen place-content-center bg-slate-100">
            <CheckCircleIcon className="text-green-400"></CheckCircleIcon>
            <div className="grid grid-cols-2 rounded-lg bg-white p-4 shadow-lg">
                <p className="text-lg font-bold">
                    Group(s): {reservations[0].group_name}
                </p>
                <p className="col-start-2 font-bold">
                    {format(startTime, "PPPp z")}
                </p>
                <p className="col-span-2">
                    <b>Bases: </b>
                    {reservations
                        .map(
                            (reservation) =>
                                bases.find(
                                    (base) =>
                                        reservation.facility_id === base.id
                                )?.name
                        )
                        .join(", ")}
                </p>
                <div className="col-start-2 flex justify-center">
                    <a
                        target="_blank"
                        className="shadow-s inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        href={channel}
                    >
                        Return to Discord
                    </a>
                </div>
            </div>
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
