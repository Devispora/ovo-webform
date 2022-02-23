const fs = require("fs/promises");

const fetch = (...args) =>
    import("node-fetch").then(({ default: fetch }) => fetch(...args));

const ContinentIDMapping = {
    Indar: 2,
    Hossin: 4,
    Amerish: 6,
    Esamir: 8,
    Oshur: 334,
};

async function updateBases() {
    const continents = ["Amerish", "Hossin", "Indar", "Esamir", "Oshur"];

    const bases = {
        Amerish: [],
        Indar: [],
        Hossin: [],
        Esamir: [],
        Oshur: [],
    };

    for (let continent of continents) {
        if (continent === "Oshur") {
            const res = await fetch("https://api.ps2alerts.com/census/oshur");

            const resBody = await res.json();

            const continentBases = resBody
                .filter(
                    (region) =>
                        region.facility_type_id !== "7" &&
                        region.facility_type_id !== "0"
                )
                .map((region) => {
                    return {
                        name: region.facility_name,
                        id: Number.parseInt(region.facility_id),
                    };
                });

            bases[continent] = continentBases;
        } else {
            const res = await fetch(
                `https://census.daybreakgames.com/get/ps2:v2/map_region/?zone_id=${ContinentIDMapping[continent]}&facility_type_id=!7&c:limit=1000&c:show=facility_name,facility_id`
            );

            const resBody = await res.json();

            const continentBases = resBody.map_region_list.map((region) => {
                return {
                    name: region.facility_name,
                    id: Number.parseInt(region.facility_id),
                };
            });

            bases[continent] = continentBases;
        }
    }

    try {
        await fs.mkdir("./app/bases");
    } catch (err) {
        console.log("Bases folder already exists! Replacing files...");
    }

    for (let continent of continents) {
        console.log(`Creating/Updating ${continent}.json`);

        await fs.writeFile(
            `./app/bases/${continent}.json`,
            JSON.stringify(bases[continent])
        );
    }
}

(async () => await updateBases())();
