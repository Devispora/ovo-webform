import { intervalToDuration, isPast } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";
import { useEffect, useState } from "react";
import { useNavigate } from "remix";

export default function useSessionTimer(expiration: number, timezone: string) {
    const navigate = useNavigate();

    const sessionExpiration = utcToZonedTime(new Date(expiration), timezone);

    const [expiryDuration, setExpiryDuration] = useState(
        intervalToDuration({
            start: new Date(),
            end: sessionExpiration,
        })
    );

    useEffect(() => {
        const interval = setInterval(() => {
            setExpiryDuration(
                intervalToDuration({
                    start: new Date(),
                    end: sessionExpiration,
                })
            );
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (isPast(sessionExpiration)) {
            navigate("/reserve");
        }
    }, [expiryDuration]);

    return expiryDuration;
}
