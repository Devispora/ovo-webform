import { json, LoaderFunction } from "remix";
import { getContinentBases } from "~/services/bases.server";
import { Continent } from "~/services/constants";

export const loader: LoaderFunction = async ({ request, context }) => {
    let url = new URL(request.url);

    let continent: Continent = url.searchParams.get("continent")
        ? (url.searchParams.get("continent") as Continent)
        : "Indar";

    const bases = getContinentBases(context.env.CENSUS_ID, continent);

    return json(
        {
            bases,
        },
        {
            headers: {
                "Cache-Control": "max-age=3600",
            },
        }
    );
};
