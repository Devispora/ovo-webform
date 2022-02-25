import { addHours, parse, startOfHour, roundToNearestMinutes } from "date-fns";
import { format, zonedTimeToUtc } from "date-fns-tz";
import { ChangeEvent, useEffect, useState } from "react";
import {
    Form,
    ActionFunction,
    redirect,
    LoaderFunction,
    json,
    useLoaderData,
    useFetcher,
    HeadersFunction,
    LinksFunction,
} from "remix";
import { getContinentBases, reserveBases } from "~/services/bases.server";
import { Base, Continent } from "~/services/constants";
import { hasActiveSession } from "~/services/session.server";
import { ClientOnly } from "remix-utils";
import DatePicker from "~/components/DatePicker";
import antdStyles from "antd/dist/antd.css";
import { CalendarFilled } from "@ant-design/icons";

const { RangePicker } = DatePicker;

type LoaderData = {
    continent: Continent;
    bases: Base[];
};

export const links: LinksFunction = () => {
    return [{ rel: "stylesheet", href: antdStyles }];
};

export const action: ActionFunction = async ({ request, context }) => {
    const session = await context.sessionStorage.getSession(
        request.headers.get("Cookie")
    );

    const token: string = session.get("token");

    if (token) {
        const formData = Object.fromEntries(await request.formData());

        const { groups, timzone, startTimestamp, endTimestamp, base } =
            formData;

        console.log(formData);

        const startDatetime = zonedTimeToUtc(
            startTimestamp as string,
            timzone as string
        );

        const endDatetime = zonedTimeToUtc(
            endTimestamp as string,
            timzone as string
        );

        /*
        try {
            const response = await reserveBases(
                token,
                context.env.OVO_BASE_SERVICE as string,
                groups as string,
                [Number.parseInt(base as string)],
                startDatetime.getTime() / 1000,
                endDatetime.getTime() / 1000
            );

            console.log(await response.json());
        } catch (err) {
            console.log(err);
        }*/
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

    let url = new URL(request.url);

    let continent: Continent = url.searchParams.get("continent")
        ? (url.searchParams.get("continent") as Continent)
        : "Indar";

    const bases = getContinentBases(context.env.CENSUS_ID, continent);

    return json({
        continent,
        bases: bases,
    });
};

export const headers: HeadersFunction = () => {
    return {
        "Cache-Control": "public, max-age=0, must-revalidate",
    };
};

export default function NewReservation() {
    const { continent: initialContinent, bases: initialBases } =
        useLoaderData<LoaderData>();

    const fetcher = useFetcher<LoaderData>();

    let bases = fetcher.data ? fetcher.data.bases : initialBases;
    let continent = fetcher.data ? fetcher.data.continent : initialContinent;

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

    function handleContinentChange(event: ChangeEvent<HTMLSelectElement>) {
        const newContinent = event.target.value;
        fetcher.submit({ continent: newContinent });
    }

    function handleStartChange(event: ChangeEvent<HTMLInputElement>) {
        setStartTimestamp(
            parse(event.target.value, "yyyy-MM-dd'T'HH:mm", new Date())
        );
    }

    function handleEndChange(event: ChangeEvent<HTMLInputElement>) {
        setCustomEnd(true);
        setEndTimestamp(
            parse(event.target.value, "yyyy-MM-dd'T'HH:mm", new Date())
        );
    }

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

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return (
        <div className="m-auto grid h-full w-full content-center justify-center bg-slate-100">
            <ClientOnly>
                <Form reloadDocument method="post" className="rounded-lg p-4">
                    <div className="mt-10 sm:mt-0">
                        <div className="md:grid md:grid-cols-2 md:gap-6">
                            <div className="mt-5 md:col-span-2 md:mt-0">
                                <div className="overflow-hidden shadow sm:rounded-md">
                                    <div className="bg-white px-4 py-5 sm:p-6">
                                        <div className="grid grid-cols-6 gap-6">
                                            <div className="col-span-6 sm:col-span-3">
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
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                />
                                            </div>
                                            <div className="col-span-6 sm:col-span-4">
                                                <label
                                                    htmlFor="timerange"
                                                    className="block text-sm font-medium text-gray-700"
                                                >
                                                    Time Range
                                                </label>
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
                                            </div>
                                            <div className="col-span-6 sm:col-span-2 sm:col-start-1">
                                                <label
                                                    htmlFor="continent"
                                                    className="block text-sm font-medium text-gray-700"
                                                >
                                                    Continent
                                                </label>
                                                <select
                                                    id="continent"
                                                    name="continent"
                                                    onChange={
                                                        handleContinentChange
                                                    }
                                                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                                                >
                                                    <option value="Indar">
                                                        Indar
                                                    </option>
                                                    <option value="Amerish">
                                                        Amerish
                                                    </option>
                                                    <option value="Esamir">
                                                        Esamir
                                                    </option>
                                                    <option value="Hossin">
                                                        Hossin
                                                    </option>
                                                    <option value="Oshur">
                                                        Oshur
                                                    </option>
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
                                                    name="base"
                                                    required
                                                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                                                >
                                                    {bases.map((base) => (
                                                        <option
                                                            key={base.id}
                                                            value={base.id}
                                                        >
                                                            {base.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-span-6 sm:col-span-6 lg:col-span-1"></div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
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
                        readOnly
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
            </ClientOnly>
        </div>
    );
}
