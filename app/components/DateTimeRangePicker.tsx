import { CalendarFilled } from "@ant-design/icons";
import {
    addHours,
    eachHourOfInterval,
    eachMinuteOfInterval,
    getHours,
    getMinutes,
    isAfter,
    isBefore,
    isEqual,
    isThisHour,
    isToday,
    startOfDay,
    startOfHour,
    subHours,
    subMinutes,
} from "date-fns";
import React, { useEffect, useState } from "react";
import { ClientOnly } from "remix-utils";
import DatePicker from "~/components/DatePicker";

const { RangePicker } = DatePicker;

export type DateTimeRangePickerProps = {
    startTimestampProps: [Date, React.Dispatch<React.SetStateAction<Date>>];
    endTimestampProps: [Date, React.Dispatch<React.SetStateAction<Date>>];
    durationProps: [number, React.Dispatch<React.SetStateAction<number>>];
};

export default function DateTimeRangePicker(props: DateTimeRangePickerProps) {
    let [customEnd, setCustomEnd] = useState<boolean>(false);
    const [startTimestamp, setStartTimestamp] = props.startTimestampProps;
    const [endTimestamp, setEndTimestamp] = props.endTimestampProps;
    const [duration, setDuration] = props.durationProps;

    useEffect(() => {
        if (!customEnd) {
            setEndTimestamp(addHours(startTimestamp, duration));
        }
    }, [startTimestamp, duration, customEnd]);

    function handleRangeChange(
        values: [Date | null, Date | null] | null,
        _dateStrings: [string, string],
        info: { range: "start" | "end" }
    ) {
        console.log(values);

        if (info.range === "start") {
            if (values?.[0]) {
                if (values?.[1]) {
                    if (isEqual(values[1], endTimestamp)) {
                        setStartTimestamp(values[0]);
                    } else {
                        setStartTimestamp(values[1]);
                    }
                } else {
                    setStartTimestamp(values[0]);
                }
            }
        } else {
            if (values?.[0] && values[1] && isAfter(values[1], values[0])) {
                setCustomEnd(true);
                setEndTimestamp(values[1]);
            } else if (values?.[0]) {
                setCustomEnd(true);
                setEndTimestamp(values[0]);
            }
        }
    }

    return (
        <ClientOnly
            fallback={
                <input
                    type="text"
                    name="date-range"
                    id="date-range"
                    required
                    autoFocus
                    className="mt-1 block w-4/6 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
                disabledDate={(current) =>
                    isBefore(current, startOfDay(new Date()))
                }
                disabledTime={(date: Date | null, type: "start" | "end") => {
                    return {
                        disabledHours: () => {
                            if (date) {
                                if (isToday(date)) {
                                    const previousHours = eachHourOfInterval({
                                        start: startOfDay(date),
                                        end: subHours(new Date(), 1),
                                    });

                                    return previousHours.map((hour) =>
                                        getHours(hour)
                                    );
                                }
                            }

                            return [];
                        },
                        disabledMinutes: () => {
                            if (date) {
                                if (isToday(date)) {
                                    if (isThisHour(date)) {
                                        const previousMinutes =
                                            eachMinuteOfInterval({
                                                start: startOfHour(date),
                                                end: subMinutes(new Date(), 1),
                                            });

                                        return previousMinutes.map((minute) =>
                                            getMinutes(minute)
                                        );
                                    }
                                }
                            }

                            return [];
                        },
                    };
                }}
                onCalendarChange={handleRangeChange}
                suffixIcon={<CalendarFilled />}
                style={{
                    borderRadius: "0.25rem",
                    marginTop: "0.25rem",
                }}
                className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                renderExtraFooter={() => {
                    return (
                        <div className="flex space-x-2">
                            <button
                                type="button"
                                className="my-2 rounded-lg bg-emerald-400 px-2 font-medium hover:bg-emerald-500"
                                onClick={() => {
                                    setCustomEnd(false);
                                    setDuration(1);
                                }}
                            >
                                Duration: 1 Hours
                            </button>
                            <button
                                type="button"
                                className="my-2 rounded-lg bg-emerald-400 px-2 font-medium hover:bg-emerald-500"
                                onClick={() => {
                                    setCustomEnd(false);
                                    setDuration(2);
                                }}
                            >
                                Duration: 2 Hours
                            </button>
                        </div>
                    );
                }}
                defaultValue={[startTimestamp, null]}
                value={[startTimestamp, endTimestamp]}
            ></RangePicker>
        </ClientOnly>
    );
}
