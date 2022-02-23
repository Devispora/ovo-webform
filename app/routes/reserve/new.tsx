import { addHours, parse, startOfHour } from "date-fns";
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
} from "remix";
import { getContinentBases, reserveBases } from "~/services/bases.server";
import { Base, Continent } from "~/services/constants";
import { hasActiveSession } from "~/services/session.server";

type LoaderData = {
    continent: Continent;
    bases: Base[];
};

export const action: ActionFunction = async ({ request, context }) => {
    const session = await context.sessionStorage.getSession(
        request.headers.get("Cookie")
    );

    const token: string = session.get("token");

    if (token) {
        const { groups, timzone, startTimestamp, endTimestamp, base } =
            Object.fromEntries(await request.formData());

        const startDatetime = zonedTimeToUtc(
            startTimestamp as string,
            timzone as string
        );

        const endDatetime = zonedTimeToUtc(
            endTimestamp as string,
            timzone as string
        );

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

export default function NewReservation() {
    const { continent: initialContinent, bases: initialBases } =
        useLoaderData<LoaderData>();

    const fetcher = useFetcher<LoaderData>();

    let bases = fetcher.data ? fetcher.data.bases : initialBases;
    let continent = fetcher.data ? fetcher.data.continent : initialContinent;

    let [startTimestamp, setStartTimestamp] = useState<Date>(new Date());
    let [endTimestamp, setEndTimestamp] = useState<Date>(
        addHours(startTimestamp, 2)
    );
    let [customEnd, setCustomEnd] = useState<boolean>(false);

    useEffect(() => {
        if (!customEnd) {
            setEndTimestamp(addHours(startTimestamp, 2));
        }
    }, [startTimestamp]);

    function handleContinentChange(event: ChangeEvent<HTMLSelectElement>) {
        const newContinent = event.target.value;
        fetcher.submit({ continent: newContinent });
    }

    function handleStartChange(event: ChangeEvent<HTMLInputElement>) {
        console.log(event.target.value);

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

    const tzAbbrv = format(new Date(), "z");
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return (
        <div className="w-full h-screen container grid m-auto justify-center content-center">
            <Form
                reloadDocument
                method="post"
                className="bg-slate-200 rounded-lg p-4"
            >
                <div className="mb-6">
                    <label className="block" htmlFor="groups">
                        <span className="leading-7 text-sm text-current">
                            Groups
                        </span>
                    </label>
                    <input
                        name="groups"
                        type="text"
                        required
                        className="rounded"
                    ></input>
                </div>
                <input
                    name="timezone"
                    type="hidden"
                    hidden
                    value={timezone}
                ></input>
                <div className="mb-6">
                    <label className="block" htmlFor="startTimestamp">
                        <span className="leading-7 text-sm text-current">
                            Start Date & Time
                        </span>
                    </label>
                    <input
                        name="startTimestamp"
                        type="datetime-local"
                        required
                        className="rounded"
                        min={formatDateInput(startOfHour(new Date()))}
                        step={60 * 30}
                        value={formatDateInput(startTimestamp)}
                        onChange={handleStartChange}
                    ></input>
                </div>
                <div className="mb-6">
                    <label className="block" htmlFor="endTimestamp">
                        <span className="leading-7 text-sm text-current">
                            End Date & Time
                        </span>
                    </label>
                    <input
                        name="endTimestamp"
                        type="datetime-local"
                        required
                        className="rounded"
                        min={formatDateInput(
                            addHours(startOfHour(new Date()), 1)
                        )}
                        step={60 * 30}
                        value={formatDateInput(endTimestamp)}
                        onChange={handleEndChange}
                    ></input>
                </div>
                <div className="mb-6">
                    <label className="block" htmlFor="continent">
                        <span className="leading-7 text-sm text-current">
                            Continent
                        </span>
                    </label>
                    <select
                        name="continent"
                        required
                        className="rounded"
                        onChange={handleContinentChange}
                        value={continent}
                    >
                        <option value="Indar">Indar</option>
                        <option value="Amerish">Amerish</option>
                        <option value="Esamir">Esamir</option>
                        <option value="Hossin">Hossin</option>
                        <option value="Oshur">Oshur</option>
                    </select>
                </div>
                <div className="mb-6">
                    <label className="block" htmlFor="base">
                        <span className="leading-7 text-sm text-current">
                            Base
                        </span>
                    </label>
                    <select name="base" required className="rounded">
                        {bases.map((base) => (
                            <option key={base.id} value={base.id}>
                                {base.name}
                            </option>
                        ))}
                    </select>
                </div>
                <button
                    type="submit"
                    className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                    Reserve Bases
                </button>
            </Form>
        </div>
    );
}
