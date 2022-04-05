import { addHours, formatDuration, startOfHour } from "date-fns";
import { zonedTimeToUtc } from "date-fns-tz";
import React, { Reducer, useMemo, useReducer, useState } from "react";
import {
    Form,
    ActionFunction,
    redirect,
    LoaderFunction,
    LinksFunction,
    json,
    useLoaderData,
    useActionData,
    useCatch,
    ErrorBoundaryComponent,
    useTransition,
} from "remix";
import { decodeAndValidateToken } from "~/services/session.server";
import { ClientOnly } from "remix-utils";
import antdStyles from "antd/dist/antd.css";
import SelectSearchCSS from "react-select-search/style.css";
import BaseRow from "~/components/BaseRow";
import classNames from "classnames";
import { createReservation } from "~/services/reservation.server";
import DateTimeRangePicker from "~/components/DateTimeRangePicker";
import useSessionTimer from "~/utils/sessionTimer";
import { PlusIcon } from "@heroicons/react/solid";
import ErrorComponent from "~/components/Error";

export const links: LinksFunction = () => {
    return [
        { rel: "stylesheet", href: antdStyles },
        { rel: "stylesheet", href: SelectSearchCSS },
    ];
};

type ActionData = {
    reserved: number[];
    failed: number[];
};

export const action: ActionFunction = async ({ request, context }) => {
    try {
        return await createReservation(request, context);
    } catch (err) {
        context.sentry.captureException(err);
        throw err;
    }
};

type LoaderData = {
    validUntil: number;
    groups: string;
};

export const loader: LoaderFunction = async ({ request, context }) => {
    try {
        const token = await decodeAndValidateToken(context, request);

        if (!token) {
            return redirect("/reserve");
        }

        const groups = token.ovo_claims?.groups.join(", ");

        return json({ validUntil: token.exp, groups });
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

type BasesState = {
    lastBaseID: number;
    bases: { [K: number]: number | null };
};

export type BasesAction =
    | { type: "delete"; id: number }
    | { type: "create" }
    | { type: "update"; id: number; facility: number | null };

export default function NewReservation() {
    const loaderData = useLoaderData<LoaderData>();
    const actionData = useActionData<ActionData>();
    const transition = useTransition();
    // TODO: Show reservation errors

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const expiryDuration = useSessionTimer(
        loaderData.validUntil * 1000,
        timezone
    );

    let [reservationBases, dispatchBases] = useReducer<
        Reducer<BasesState, BasesAction>
    >(
        (state: BasesState, action: BasesAction) => {
            switch (action.type) {
                case "create": {
                    return {
                        lastBaseID: state.lastBaseID + 1,
                        bases: {
                            ...state.bases,
                            [state.lastBaseID + 1]: null,
                        },
                    };
                }
                case "update": {
                    return {
                        lastBaseID: state.lastBaseID,
                        bases: {
                            ...state.bases,
                            [action.id]: action.facility,
                        },
                    };
                }
                case "delete": {
                    let newState = { ...state };

                    delete newState.bases[action.id];

                    return newState;
                }
            }
        },
        {
            lastBaseID: 0,
            bases: {
                0: null,
            },
        }
    );

    let [startTimestamp, setStartTimestamp] = useState<Date>(
        startOfHour(addHours(new Date(), 1))
    );
    let [duration, setDuration] = useState(1);
    let [endTimestamp, setEndTimestamp] = useState<Date>(
        addHours(startTimestamp, duration)
    );

    const startTimeUTC = useMemo(
        () =>
            zonedTimeToUtc(startTimestamp, timezone as string).getTime() / 1000,
        [startTimestamp]
    );

    const endTimeUTC = useMemo(
        () => zonedTimeToUtc(endTimestamp, timezone as string).getTime() / 1000,
        [endTimestamp]
    );

    const numBases = useMemo(
        () => Object.keys(reservationBases.bases).length,
        [reservationBases]
    );

    const [groups, setGroups] = useState(loaderData.groups);

    let isAlmostExpired =
        (expiryDuration.minutes && expiryDuration.minutes < 5) ||
        !expiryDuration.minutes;

    let countdownClass = classNames(
        "text-medium col-span-1 col-start-3 text-center font-semibold",
        {
            "text-red-700": isAlmostExpired,
        }
    );

    let readyToSubmit = useMemo(
        () =>
            Object.values(reservationBases.bases).every(
                (baseID) => baseID !== null
            ),
        [reservationBases]
    );

    return (
        <div className="m-auto grid h-screen w-screen place-content-center overflow-auto bg-slate-100">
            <Form method="post" className="rounded-lg p-4">
                <fieldset disabled={transition.state === "submitting"}>
                    <div className="mt-10 sm:mt-0">
                        <div className="mt-5 md:mt-0">
                            <div className="shadow sm:rounded-md">
                                <div className="grid grid-cols-3 bg-white px-4 py-5 sm:p-6">
                                    <div className="col-span-3 mb-2 grid grid-cols-3 border-b-2">
                                        <p className="col-span-1 text-xl font-bold">
                                            Bases Reservation Form
                                        </p>
                                        <ClientOnly>
                                            <p className={countdownClass}>
                                                {formatDuration(expiryDuration)}
                                            </p>
                                        </ClientOnly>
                                    </div>
                                    <div className="col-span-3 grid grid-cols-4 gap-6">
                                        <div className="col-span-4 sm:col-span-3">
                                            <label
                                                htmlFor="groups"
                                                className="block text-sm font-medium text-gray-700"
                                            >
                                                Groups
                                            </label>
                                            <input
                                                type="text"
                                                name="groups"
                                                id="groups"
                                                required
                                                value={groups}
                                                onChange={(event) =>
                                                    setGroups(
                                                        event.target.value
                                                    )
                                                }
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            />
                                        </div>
                                        <div className="col-span-4 sm:col-span-4">
                                            <label
                                                htmlFor="timerange"
                                                className="block text-sm font-medium text-gray-700"
                                            >
                                                Time Range
                                            </label>
                                            <DateTimeRangePicker
                                                startTimestampProps={[
                                                    startTimestamp,
                                                    setStartTimestamp,
                                                ]}
                                                endTimestampProps={[
                                                    endTimestamp,
                                                    setEndTimestamp,
                                                ]}
                                                durationProps={[
                                                    duration,
                                                    setDuration,
                                                ]}
                                            />
                                        </div>
                                        {Object.keys(
                                            reservationBases.bases
                                        ).map((baseKey) => {
                                            const base =
                                                reservationBases.bases[
                                                    Number.parseInt(baseKey)
                                                ];

                                            return (
                                                <BaseRow
                                                    key={baseKey}
                                                    id={Number.parseInt(
                                                        baseKey
                                                    )}
                                                    facilityID={base}
                                                    canDelete={numBases > 1}
                                                    dispatch={dispatchBases}
                                                    from={startTimeUTC}
                                                    to={endTimeUTC}
                                                />
                                            );
                                        })}
                                    </div>
                                    <button
                                        type="button"
                                        disabled={numBases === 4}
                                        onClick={() => {
                                            dispatchBases({ type: "create" });
                                        }}
                                        className="w-30 col-span-1 col-start-2 mt-4 inline-flex justify-center rounded-md bg-indigo-600 px-2 py-2 text-center text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        <PlusIcon className="mx-1 h-5 w-5" />
                                        Base
                                    </button>
                                </div>
                                <div className="bg-gray-60 w-full px-4 py-3 text-right sm:px-6">
                                    <button
                                        type="submit"
                                        disabled={!readyToSubmit}
                                        className="inline-flex justify-center rounded-md border border-transparent bg-green-700 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                                    >
                                        {transition.state === "submitting"
                                            ? "Reserving..."
                                            : "Reserve"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </fieldset>
                <input
                    name="startTimestamp"
                    type="hidden"
                    hidden
                    value={startTimeUTC}
                ></input>
                <input
                    name="endTimestamp"
                    type="hidden"
                    hidden
                    value={endTimeUTC}
                ></input>
            </Form>
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
