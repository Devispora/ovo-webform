// @ts-nocheck

import generatePicker from "antd/es/date-picker/generatePicker";

// Copied from https://github.com/react-component/picker/blob/master/src/generate/dateFns.ts but adjusted to use date-fns-tz for formatting
import {
    getDay,
    getYear as _getYear,
    getMonth as _getMonth,
    getDate as _getDate,
    endOfMonth,
    getHours,
    getMinutes,
    getSeconds,
    addYears,
    addMonths,
    addDays,
    setYear as _setYear,
    setMonth as _setMonth,
    setDate as _setDate,
    setHours,
    setMinutes,
    setSeconds,
    isAfter as _isAfter,
    isValid,
    getWeek as _getWeek,
    startOfWeek,
} from "date-fns";
import { format as formatDate, toDate as parseDate } from "date-fns-tz";
import * as Locale from "date-fns/locale";

function dealLocal(str: string) {
    return str.replace(/_/g, "");
}

var localeParse = function localeParse(format: string) {
    return format
        .replace(/Y/g, "y")
        .replace(/D/g, "d")
        .replace(/gggg/, "yyyy")
        .replace(/g/g, "G")
        .replace(/([Ww])o/g, "wo");
};

const generateConfig = {
    // get
    getNow: function getNow() {
        return new Date();
    },
    getFixedDate: function getFixedDate(string) {
        return new Date(string);
    },
    getEndDate: function getEndDate(date: Date) {
        return endOfMonth(date);
    },
    getWeekDay: function getWeekDay(date: Date) {
        return getDay(date);
    },
    getYear: function getYear(date: Date) {
        return _getYear(date);
    },
    getMonth: function getMonth(date: Date) {
        return _getMonth(date);
    },
    getDate: function getDate(date: Date) {
        return _getDate(date);
    },
    getHour: function getHour(date: Date) {
        return getHours(date);
    },
    getMinute: function getMinute(date: Date) {
        return getMinutes(date);
    },
    getSecond: function getSecond(date: Date) {
        return getSeconds(date);
    },
    // set
    addYear: function addYear(date: Date, diff: number) {
        return addYears(date, diff);
    },
    addMonth: function addMonth(date: Date, diff: number) {
        return addMonths(date, diff);
    },
    addDate: function addDate(date: Date, diff: number) {
        return addDays(date, diff);
    },
    setYear: function setYear(date: Date, year: number) {
        return _setYear(date, year);
    },
    setMonth: function setMonth(date: Date, month: number) {
        return _setMonth(date, month);
    },
    setDate: function setDate(date: Date, num: number) {
        return _setDate(date, num);
    },
    setHour: function setHour(date: Date, hour: number) {
        return setHours(date, hour);
    },
    setMinute: function setMinute(date: Date, minute: number) {
        return setMinutes(date, minute);
    },
    setSecond: function setSecond(date: Date, second: number) {
        return setSeconds(date, second);
    },
    // Compare
    isAfter: function isAfter(date1: Date, date2: Date) {
        return _isAfter(date1, date2);
    },
    isValidate: function isValidate(date: Date) {
        return isValid(date);
    },
    locale: {
        getWeekFirstDay: function getWeekFirstDay(locale: string) {
            let clone = Locale[dealLocal(locale)];
            return clone.options.weekStartsOn;
        },
        getWeekFirstDate: function getWeekFirstDate(
            locale: string,
            date: Date
        ) {
            return startOfWeek(date, {
                locale: Locale[dealLocal(locale)],
            });
        },
        getWeek: function getWeek(locale: string, date: Date) {
            return _getWeek(date, {
                locale: Locale[dealLocal(locale)],
            });
        },
        getShortWeekDays: function getShortWeekDays(locale: string) {
            let clone = Locale[dealLocal(locale)];
            return Array.from({
                length: 7,
            }).map(function (_, i) {
                return clone.localize.day(i, {
                    width: "short",
                });
            });
        },
        getShortMonths: function getShortMonths(locale: string) {
            let clone = Locale[dealLocal(locale)];
            return Array.from({
                length: 12,
            }).map(function (_, i) {
                return clone.localize.month(i, {
                    width: "abbreviated",
                });
            });
        },
        format: function format(locale: string, date: Date, _format: string) {
            if (!isValid(date)) {
                return null;
            }

            return formatDate(date, localeParse(_format), {
                locale: Locale[dealLocal(locale)],
            });
        },
        parse: function parse(locale: string, text: string, formats: string[]) {
            for (let i = 0; i < formats.length; i += 1) {
                let format = localeParse(formats[i]);
                let formatText = text;
                let date = parseDate(formatText, format, new Date(), {
                    locale: Locale[dealLocal(locale)],
                });

                if (isValid(date)) {
                    return date;
                }
            }

            return null;
        },
    },
};

const DatePicker = generatePicker<Date>(generateConfig);

export default DatePicker;
