import {
    addHours,
    formatDuration,
    intervalToDuration,
    isPast,
    roundToNearestMinutes,
    isBefore,
    isAfter,
} from "date-fns";
import { utcToZonedTime, zonedTimeToUtc } from "date-fns-tz";
import React, {
    Reducer,
    useEffect,
    useMemo,
    useReducer,
    useState,
} from "react";
import {
    Form,
    ActionFunction,
    redirect,
    LoaderFunction,
    HeadersFunction,
    LinksFunction,
    json,
    useNavigate,
    useLoaderData,
} from "remix";
import { decodeAndValidateToken } from "~/services/session.server";
import { ClientOnly } from "remix-utils";
import DatePicker from "~/components/DatePicker";
import antdStyles from "antd/dist/antd.css";
import SelectSearchCSS from "react-select-search/style.css";
import { CalendarFilled } from "@ant-design/icons";
import { reserveBases } from "~/services/bases.server";
import BaseRow from "~/components/BaseRow";
import { FormDataObject, objectFromFormData } from "~/services/utils.server";
import classNames from "classnames";

const { RangePicker } = DatePicker;

export const links: LinksFunction = () => {
    return [
        { rel: "stylesheet", href: antdStyles },
        { rel: "stylesheet", href: SelectSearchCSS },
    ];
};

type ReservationData = FormDataObject & {
    groups: string;
    bases: string[] | string;
    startTimestamp: string;
    endTimestamp: string;
};

export const action: ActionFunction = async ({ request, context }) => {
    const session = await context.sessionStorage.getSession(
        request.headers.get("Cookie")
    );

    const token: string = session.get("token");

    if (token) {
        const formData = await request.formData();

        const data = objectFromFormData<ReservationData>(formData);

        const { groups, startTimestamp, endTimestamp, bases } = data;

        try {
            const reservationResponse = await reserveBases(
                context.env.OVO_BASE_SERVICE as string,
                token,
                groups as string,
                Array.isArray(bases)
                    ? bases.map((base) => Number.parseInt(base))
                    : [Number.parseInt(bases)],
                Number.parseInt(startTimestamp),
                Number.parseInt(endTimestamp)
            );

            if (reservationResponse) {
                console.log(reservationResponse);
                if (reservationResponse.failed.length > 0) {
                    return json(reservationResponse, {
                        status: 409,
                    });
                } else {
                }
            }
        } catch (err) {
            console.log(err);
        }
    }

    return redirect("/");
};

type LoaderData = {
    validUntil: number;
};

export const loader: LoaderFunction = async ({ request, context }) => {
    const token = await decodeAndValidateToken(context, request);

    if (!token) {
        return redirect("/reserve");
    }

    return json({ validUntil: token.exp });
};

export const headers: HeadersFunction = () => {
    return {
        "Cache-Control": "public, max-age=0, must-revalidate",
    };
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
    let navigate = useNavigate();

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const tokenExpiration = utcToZonedTime(
        new Date(loaderData.validUntil * 1000),
        timezone
    );

    const [expiryDuration, setExpiryDuration] = useState(
        intervalToDuration({
            start: new Date(),
            end: tokenExpiration,
        })
    );

    useEffect(() => {
        const interval = setInterval(() => {
            setExpiryDuration(
                intervalToDuration({
                    start: new Date(),
                    end: tokenExpiration,
                })
            );
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (isPast(tokenExpiration)) {
            navigate("/reserve?reason=tokenExpired");
        }
    }, [expiryDuration]);

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

    const numBases = useMemo(
        () => Object.keys(reservationBases.bases).length,
        [reservationBases]
    );

    let [startTimestamp, setStartTimestamp] = useState<Date>(
        roundToNearestMinutes(new Date(), {
            nearestTo: 30,
        })
    );
    let [duration, setDuration] = useState(1);
    let [endTimestamp, setEndTimestamp] = useState<Date>(
        addHours(startTimestamp, 1)
    );
    let [customEnd, setCustomEnd] = useState<boolean>(false);

    useEffect(() => {
        if (!customEnd) {
            setEndTimestamp(addHours(startTimestamp, duration));
        }
    }, [startTimestamp, duration, customEnd]);

    const startTimeUTC = useMemo(
        () =>
            zonedTimeToUtc(startTimestamp, timezone as string).getTime() / 1000,
        [startTimestamp]
    );

    const endTimeUTC = useMemo(
        () => zonedTimeToUtc(endTimestamp, timezone as string).getTime() / 1000,
        [endTimestamp]
    );

    function handleRangeChange(
        values: [Date | null, Date | null] | null,
        _dateStrings: [string, string],
        info: { range: "start" | "end" }
    ) {
        if (info.range === "start") {
            if (values?.[0] && values[1] && endTimestamp === values[1]) {
                setStartTimestamp(values[0]);
            } else if (values?.[1]) {
                setStartTimestamp(values[1]);
            }
        } else {
            if (values?.[0] && values[1] && isAfter(values[0], values[1])) {
                setCustomEnd(true);
                setEndTimestamp(values[1]);
            } else if (values?.[0]) {
                setCustomEnd(true);
                setEndTimestamp(values[0]);
            }
        }
    }

    let isAlmostExpired = expiryDuration.minutes && expiryDuration.minutes < 5;
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
            <Form reloadDocument method="post" className="rounded-lg p-4">
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
                                            autoFocus
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
                                        <ClientOnly
                                            fallback={
                                                <input
                                                    type="text"
                                                    name="date-range"
                                                    id="date-range"
                                                    required
                                                    autoFocus
                                                    className="mt-1 block w-4/6 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                />
                                            }
                                        >
                                            <RangePicker
                                                name="timerange"
                                                showTime
                                                bordered
                                                minuteStep={15}
                                                size="large"
                                                format="YYYY-MM-DD HH:mm z"
                                                disabledDate={(current) =>
                                                    isBefore(
                                                        current,
                                                        new Date()
                                                    )
                                                }
                                                onCalendarChange={
                                                    handleRangeChange
                                                }
                                                suffixIcon={<CalendarFilled />}
                                                style={{
                                                    borderRadius: "0.25rem",
                                                    marginTop: "0.25rem",
                                                }}
                                                className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                renderExtraFooter={() => {
                                                    return (
                                                        <div className="flex space-x-2">
                                                            <button
                                                                type="button"
                                                                className="my-2 rounded-lg bg-emerald-400 px-2 font-medium hover:bg-emerald-500"
                                                                onClick={() => {
                                                                    setCustomEnd(
                                                                        false
                                                                    );
                                                                    setDuration(
                                                                        1
                                                                    );
                                                                }}
                                                            >
                                                                Duration: 1
                                                                Hours
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="my-2 rounded-lg bg-emerald-400 px-2 font-medium hover:bg-emerald-500"
                                                                onClick={() => {
                                                                    setCustomEnd(
                                                                        false
                                                                    );
                                                                    setDuration(
                                                                        2
                                                                    );
                                                                }}
                                                            >
                                                                Duration: 2
                                                                Hours
                                                            </button>
                                                        </div>
                                                    );
                                                }}
                                                value={[
                                                    startTimestamp,
                                                    endTimestamp,
                                                ]}
                                            ></RangePicker>
                                        </ClientOnly>
                                    </div>
                                    {Object.keys(reservationBases.bases).map(
                                        (baseKey) => {
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
                                        }
                                    )}
                                </div>
                                <button
                                    type="button"
                                    disabled={numBases === 4}
                                    onClick={() => {
                                        dispatchBases({ type: "create" });
                                    }}
                                    className="w-30 col-span-1 col-start-2 mt-4 flex justify-center rounded-md bg-green-700 px-2 py-2 text-center text-white shadow-sm hover:bg-green-800 disabled:opacity-50"
                                >
                                    Add Base
                                </button>
                            </div>
                            <div className="bg-gray-60 w-full px-4 py-3 text-right sm:px-6">
                                <button
                                    type="submit"
                                    disabled={!readyToSubmit}
                                    className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                                >
                                    Reserve
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
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
