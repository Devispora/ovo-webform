import { addHours, roundToNearestMinutes } from "date-fns";
import { format, zonedTimeToUtc } from "date-fns-tz";
import React, { ChangeEvent, useEffect, useState } from "react";
import {
    Form,
    ActionFunction,
    redirect,
    LoaderFunction,
    useFetcher,
    HeadersFunction,
    LinksFunction,
} from "remix";
import { hasActiveSession } from "~/services/session.server";
import { ClientOnly } from "remix-utils";
import DatePicker from "~/components/DatePicker";
import antdStyles from "antd/dist/antd.css";
import { CalendarFilled } from "@ant-design/icons";
import { TrashIcon } from "@heroicons/react/outline";
import { BasesLoaderData } from "../bases";
import { reserveBases } from "~/services/bases.server";

const { RangePicker } = DatePicker;

export const links: LinksFunction = () => {
    return [{ rel: "stylesheet", href: antdStyles }];
};

interface FormDataObject {
    [K: string]: any;
}

type ReservationData = FormDataObject & {
    groups: string;
    bases: string[];
    startTimestamp: string;
    endTimestamp: string;
    timezone: string;
};

function objectFromFormData<T extends FormDataObject>(
    formData: FormData,
    obj: T = Object.create({})
): T {
    let values = obj;

    for (let [key, value] of formData.entries()) {
        if (values[key]) {
            if (!(values[key] instanceof Array)) {
                values[key] = new Array(values[key]);
            }
            values[key].push(value);
        } else {
            values[key] = value;
        }
    }
    return values;
}

export const action: ActionFunction = async ({ request, context }) => {
    const session = await context.sessionStorage.getSession(
        request.headers.get("Cookie")
    );

    const token: string = session.get("token");

    if (token) {
        const formData = await request.formData();

        const data = objectFromFormData<ReservationData>(formData);

        console.log(data);

        const { groups, timezone, startTimestamp, endTimestamp, bases } = data;

        const startDatetime = zonedTimeToUtc(
            startTimestamp as string,
            timezone as string
        );

        const endDatetime = zonedTimeToUtc(
            endTimestamp as string,
            timezone as string
        );

        try {
            const response = await reserveBases(
                token,
                context.env.OVO_BASE_SERVICE as string,
                groups as string,
                bases.map((base) => Number.parseInt(base)),
                startDatetime.getTime() / 1000,
                endDatetime.getTime() / 1000
            );

            console.log(await response.json());
        } catch (err) {
            console.log(err);
        }
    }

    return redirect("/");
};

function formatDateInput(date: Date): string {
    return format(date, "yyyy-MM-dd'T'HH:mm");
}

export const loader: LoaderFunction = async ({ request, context }) => {
    if (!(await hasActiveSession(context, request))) {
        return redirect("/reserve");
    }

    return null;
};

export const headers: HeadersFunction = () => {
    return {
        "Cache-Control": "public, max-age=0, must-revalidate",
    };
};

interface BaseProps {
    id: number;
    deleteBase: (index: number) => void;
}

function BaseRow(props: BaseProps) {
    const fetcher = useFetcher<BasesLoaderData>();

    useEffect(() => {
        if (fetcher.type === "init") {
            fetcher.load("/bases");
        }
    }, [fetcher]);

    let continentBases = fetcher.data ? fetcher.data.bases : [];

    function handleContinentChange(event: ChangeEvent<HTMLSelectElement>) {
        const newContinent = event.target.value;
        fetcher.load(`/bases?continent=${newContinent}`);
    }

    return (
        <fieldset
            name={`base-${props.id}`}
            className="col-span-6 grid grid-cols-6 gap-6 rounded-lg border border-solid border-gray-300 p-3 shadow"
        >
            <div className="col-span-6 sm:col-span-2 sm:col-start-1">
                <label
                    htmlFor="continent"
                    className="block text-sm font-medium text-gray-700"
                >
                    Continent
                </label>
                <select
                    id="continent"
                    onChange={handleContinentChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                >
                    <option value="Indar">Indar</option>
                    <option value="Amerish">Amerish</option>
                    <option value="Esamir">Esamir</option>
                    <option value="Hossin">Hossin</option>
                    <option value="Oshur">Oshur</option>
                </select>
            </div>
            <div className="col-span-6 sm:col-span-6 lg:col-span-3">
                <label
                    htmlFor="base"
                    className="block text-sm font-medium text-gray-700"
                >
                    Base
                </label>
                <select
                    name="bases"
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                >
                    {continentBases.map((base) => (
                        <option key={base.id} value={base.id}>
                            {base.name}
                        </option>
                    ))}
                </select>
            </div>
        </fieldset>
    );
}

export default function NewReservation() {
    let [reservationBases, setReservationBases] = useState([{}, {}]);

    let [startTimestamp, setStartTimestamp] = useState<Date>(
        roundToNearestMinutes(new Date(), {
            nearestTo: 30,
        })
    );
    let [endTimestamp, setEndTimestamp] = useState<Date>(
        addHours(startTimestamp, 1)
    );
    let [customEnd, setCustomEnd] = useState<boolean>(false);

    useEffect(() => {
        if (!customEnd) {
            setEndTimestamp(addHours(startTimestamp, 1));
        }
    }, [startTimestamp]);

    function handleRangeChange(
        values: [Date | null, Date | null] | null,
        _dateStrings: [string, string],
        info: { range: "start" | "end" }
    ) {
        if (info.range === "start") {
            if (values?.[0]) {
                setStartTimestamp(values[0]);
            }
        } else {
            if (values?.[1]) {
                setCustomEnd(true);
                setEndTimestamp(values[1]);
            }
        }
    }

    function addBase() {
        setReservationBases([...reservationBases, {}]);
    }

    function deleteBase(index: number) {}

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return (
        <div className="m-auto grid h-full w-full place-content-center bg-slate-100">
            <Form reloadDocument method="post" className="rounded-lg p-4">
                <div className="mt-10 sm:mt-0">
                    <div className="md:grid md:grid-cols-2 md:gap-6">
                        <div className="mt-5 md:col-span-2 md:mt-0">
                            <div className="overflow-hidden shadow sm:rounded-md">
                                <div className="grid grid-cols-3 bg-white px-4 py-5 sm:p-6">
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
                                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
                                                    defaultValue={[
                                                        startTimestamp,
                                                        endTimestamp,
                                                    ]}
                                                    onCalendarChange={
                                                        handleRangeChange
                                                    }
                                                    suffixIcon={
                                                        <CalendarFilled />
                                                    }
                                                    style={{
                                                        borderRadius: "0.25rem",
                                                    }}
                                                    renderExtraFooter={() => {
                                                        return <p>Test</p>;
                                                    }}
                                                    value={[
                                                        startTimestamp,
                                                        endTimestamp,
                                                    ]}
                                                ></RangePicker>
                                            </ClientOnly>
                                        </div>
                                        {reservationBases.map((base, index) => {
                                            return (
                                                <BaseRow
                                                    key={index}
                                                    id={index}
                                                    deleteBase={deleteBase}
                                                />
                                            );
                                        })}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addBase}
                                        className="w-30 col-span-1 col-start-2 mt-4 flex justify-center rounded-md bg-green-700 px-2 py-2 text-center text-white shadow-sm hover:bg-green-800"
                                    >
                                        Add Base
                                    </button>
                                </div>
                                <div className="bg-gray-60 w-full px-4 py-3 text-right sm:px-6">
                                    <button
                                        type="submit"
                                        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                    >
                                        Reserve
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <input
                    name="timezone"
                    type="hidden"
                    hidden
                    value={timezone}
                ></input>
                <input
                    name="startTimestamp"
                    type="hidden"
                    hidden
                    value={formatDateInput(startTimestamp)}
                ></input>
                <input
                    name="endTimestamp"
                    type="hidden"
                    hidden
                    value={formatDateInput(endTimestamp)}
                ></input>
            </Form>
        </div>
    );
}
