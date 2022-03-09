import { json, LoaderFunction } from "remix";
import { getAvailableBases, getContinentBases } from "~/services/bases.server";
import { Base, Continent } from "~/services/constants";

export type BasesAvailabilityLoaderData = {
    bases: Base[];
};

export const loader: LoaderFunction = async ({ request, context }) => {
    const session = await context.sessionStorage.getSession(
        request.headers.get("Cookie")
    );

    const token: string = session.get("token");

    if (!token)
        return json(
            { error: "Not authorized" },
            {
                status: 401,
            }
        );

    let url = new URL(request.url);

    let bases: number[] = [];

    const continent = url.searchParams.get("continent");

    const selectedBases = url.searchParams
        .get("bases")
        ?.split(",")
        .map((base) => Number.parseInt(base));
    const startTime = url.searchParams.get("from");
    const endTime = url.searchParams.get("to");

    if (!selectedBases && !continent)
        return json(
            { error: "Missing bases or continent parameter" },
            {
                status: 400,
            }
        );
    if (!startTime)
        return json(
            { error: "Missing from parameter" },
            {
                status: 400,
            }
        );
    if (!endTime)
        return json(
            { error: "Missing endTime parameter" },
            {
                status: 400,
            }
        );

    if (selectedBases) {
        bases = bases.concat(selectedBases);
    }

    if (continent) {
        const continentBases = getContinentBases(continent as Continent);

        continentBases.forEach((base) => {
            bases.push(base.id);
        });
    }

    const basesAvailability = await getAvailableBases(
        context.env.OVO_BASE_SERVICE as string,
        token,
        bases,
        Number.parseInt(startTime),
        Number.parseInt(endTime)
    );

    let basesAvailabilityResult: { [K: number]: boolean } = {};

    basesAvailability.result?.possible_reservations.forEach((base) => {
        basesAvailabilityResult[base.facility_id] = true;
    });

    basesAvailability.result?.denied_reservations.forEach((base) => {
        basesAvailabilityResult[base.facility_id] = false;
    });

    return json(basesAvailabilityResult);
};
