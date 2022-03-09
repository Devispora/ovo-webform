import { Base, Continent } from "./constants";
import AmerishBases from "../bases/Amerish.json";
import HossinBases from "../bases/Hossin.json";
import IndarBases from "../bases/Indar.json";
import EsamirBases from "../bases/Esamir.json";
import OshurBases from "../bases/Oshur.json";

type ReservationType = "large_event" | "scrim" | "training" | "pog";

interface OvOBaseRequest {
    facility_ids: number[];
    reservation_type: ReservationType;
    request_type: "availability" | "reservation";
    group_name: string;
    start_time?: number;
    end_time?: number;
}

type OvOReservation = {
    reservation_id: string;
    facility_id: number;
    continent: string;
    group_name: string;
    reservation_type: ReservationType;
    start_time: number;
    end_time: number;
    reservation_day: number;
};

type OvOBaseAvailabilityResponse = {
    result?: {
        possible_reservations: OvOReservation[];
        denied_reservations: OvOReservation[];
    };
    error?: string;
};

type OvOBaseReservationResponse = {
    result?: {
        succeeded_reservations: OvOReservation[];
        failed_reservations: OvOReservation[];
    };
}

export async function reserveBases(
    baseService: string,
    authToken: string,
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

    const res = await fetch(baseService, {
        method: "POST",
        body: JSON.stringify(request),
        headers: {
            Authorization: authToken,
        },
    });

    const body = await res.json<OvOBaseReservationResponse>();

    if (body.result) {
        return {
            reserved: body.result.succeeded_reservations.map(reservation => reservation.facility_id),
            failed: body.result.failed_reservations.map(reservation => reservation.facility_id)
        }
    }
}

export async function getAvailableBases(
    baseService: string,
    authToken: string,
    facilityIDs: number[],
    startTime: number,
    endTime: number
) {
    const request: OvOBaseRequest = {
        reservation_type: "scrim",
        request_type: "availability",
        facility_ids: Array.from(new Set(facilityIDs)),
        start_time: startTime,
        end_time: endTime,
        group_name: "OvO",
    };

    const res = await fetch(baseService, {
        method: "POST",
        body: JSON.stringify(request),
        headers: {
            Authorization: authToken,
        },
    });

    const body = await res.json<OvOBaseAvailabilityResponse>();

    return body;
}

export function getContinentBases(continent: Continent): Base[] {
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
