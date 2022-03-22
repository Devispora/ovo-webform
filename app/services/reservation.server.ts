import { json, redirect, Session } from "remix";
import { reserveBases } from "./bases.server";
import { FormDataObject, objectFromFormData } from "./utils.server";

export type ReservationData = FormDataObject & {
    groups: string;
    bases: string[] | string;
    startTimestamp: string;
    endTimestamp: string;
};

export async function createReservation(request: Request, context: any) {
    const { getSession, commitSession } = context.sessionStorage;
    const session: Session = await getSession(request.headers.get("Cookie"));

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

            if (reservationResponse.result) {
                if (reservationResponse.result.failed_reservations.length > 0) {
                    return json(
                        {
                            failed: reservationResponse.result.failed_reservations.map(
                                (reservation) => reservation.facility_id
                            ),
                            reserved:
                                reservationResponse.result.succeeded_reservations.map(
                                    (reservation) => reservation.facility_id
                                ),
                        },
                        {
                            status: 409,
                        }
                    );
                } else {
                    session.set(
                        "reservation",
                        JSON.stringify(
                            reservationResponse.result.succeeded_reservations
                        )
                    );

                    return redirect("/reserve/success", {
                        headers: {
                            "Set-Cookie": await commitSession(session),
                        },
                    });
                }
            }
        } catch (err) {
            console.log(err);
            return;
        }
    }

    return json(
        { error: "Not authorized" },
        {
            status: 401,
        }
    );
}
