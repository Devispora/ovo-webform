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
import ErrorComponent from "~/components/Error";
import React from "react";

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

        throw new Response(
            JSON.stringify({ channelLink: context.env.ASK_STAFF_CHANNEL }),
            {
                status: 500,
            }
        );
    }
};

export default function ReservationInfo() {
    const { reservations, channel, bases } = useLoaderData<{
        reservations: OvOReservation[];
        channel: string;
        bases: Base[];
    }>();

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const sortedReservations = reservations.sort((r1, r2) => {
        if (r1.start_time < r2.start_time) return -1;
        if (r1.start_time > r2.start_time) return 1;
        return 0;
    });
    const startTime = utcToZonedTime(
        new Date(sortedReservations[0].start_time * 1000),
        timezone
    );
    const endTime = utcToZonedTime(
        new Date(
            sortedReservations[sortedReservations.length - 1].end_time * 1000
        ),
        timezone
    );
    const uniqueBases = [
        ...new Set(reservations.map((reservation) => reservation.facility_id)),
    ];
    const uniqueReservations = uniqueBases.map((baseID) =>
        reservations.find((r) => r.facility_id === baseID)
    );

    return (
        <div className="m-auto grid h-screen w-screen place-content-center space-y-5 bg-slate-100">
            <div>
                <CheckCircleIcon className="text-green-400"></CheckCircleIcon>
                <div className="grid grid-cols-3 gap-y-2 rounded-lg bg-white p-4 shadow-lg">
                    <p className="text-lg font-bold">
                        Group(s): {reservations[0].group_name}
                    </p>
                    <p className="col-span-2 col-start-2 font-bold">
                        {`${format(startTime, "PPp z")} - ${format(
                            endTime,
                            "PPp z"
                        )}`}
                    </p>
                    <p className="col-span-2">
                        <b>Bases: </b>
                        {uniqueReservations
                            .map(
                                (reservation) =>
                                    bases.find(
                                        (base) =>
                                            reservation?.facility_id === base.id
                                    )?.name
                            )
                            .join(", ")}
                    </p>
                    <div className="col-start-3 flex justify-center">
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
        </div>
    );
}

export function CatchBoundary() {
    const caught = useCatch();

    const catchData = JSON.parse(caught.data);

    return <ErrorComponent channelLink={catchData.channelLink} />;
}

export const ErrorBoundary: ErrorBoundaryComponent = ({ error }) => {
    return <ErrorComponent />;
};
