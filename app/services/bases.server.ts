import { Base, Continent } from "./constants";
import AmerishBases from "../bases/Amerish.json";
import HossinBases from "../bases/Hossin.json";
import IndarBases from "../bases/Indar.json";
import EsamirBases from "../bases/Esamir.json";
import OshurBases from "../bases/Oshur.json";

interface OvOBaseRequest {
    facility_ids: number[];
    reservation_type: "large_event" | "scrim" | "training" | "pog";
    request_type: "availability" | "reservation";
    group_name: string;
    start_time?: number;
    end_time?: number;
}

export async function reserveBases(
    authToken: string,
    base_service: string,
    groupName: string,
    facilityIDs: number[],
    startTime: number,
    endTime: number
) {
    const request: OvOBaseRequest = {
        reservation_type: "scrim",
        request_type: "reservation",
        group_name: groupName,
        facility_ids: facilityIDs,
        start_time: startTime,
        end_time: endTime,
    };

    return fetch(base_service, {
        method: "POST",
        body: JSON.stringify(request),
        headers: {
            Authorization: authToken,
        },
    });
}

export async function getAvailableBases() {}

export function getContinentBases(
    service_id: string,
    continent: Continent
): Base[] {
    switch (continent) {
        case "Amerish":
            return AmerishBases;
        case "Hossin":
            return HossinBases;
        case "Esamir":
            return EsamirBases;
        case "Indar":
            return IndarBases;
        case "Oshur":
            return OshurBases;
    }
}
