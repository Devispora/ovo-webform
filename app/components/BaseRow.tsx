import { ChangeEvent, Dispatch, useEffect, useMemo, useState } from "react";
import { useFetcher } from "remix";
import { BasesLoaderData } from "~/routes/bases";
import { BasesAction } from "~/routes/reserve/new";
import { XIcon } from "@heroicons/react/solid";
import { Document } from "flexsearch";
import { Base } from "~/services/constants";
import SelectSearch, { SelectedOptionValue } from "react-select-search";

interface BaseProps {
    id: number;
    facilityID: number | null;
    dispatch: Dispatch<BasesAction>;
    canDelete: boolean;
    from: number;
    to: number;
}

export default function BaseRow(props: BaseProps) {
    const baseFetcher = useFetcher<BasesLoaderData>();
    const availabilityFetcher = useFetcher<{ [K: string]: boolean }>();

    const [continent, setContinent] = useState("Indar");

    useEffect(() => {
        baseFetcher.load(`/bases?continent=${continent}`);
    }, [continent]);

    let continentBases = useMemo(
        () => (baseFetcher.data ? baseFetcher.data.bases : []),
        [baseFetcher]
    );

    const availableBases = useMemo(
        () => (availabilityFetcher.data ? availabilityFetcher.data : {}),
        [availabilityFetcher]
    );

    const baseIndex = useMemo(() => {
        const docIndex = new Document<Base>({
            document: {
                id: "id",
                index: "name",
            },
            tokenize: "full",
        });

        for (let base of continentBases) {
            docIndex.add(base);
        }

        return docIndex;
    }, [continentBases]);

    useEffect(() => {
        if (continentBases.length > 0) {
            props.dispatch({
                type: "update",
                id: props.id,
                facility: null,
            });
        }
    }, [continentBases]);

    useEffect(() => {
        if (continentBases.length > 0) {
            availabilityFetcher.load(
                `/bases/availability?continent=${continent}&from=${props.from}&to=${props.to}`
            );
        }
    }, [props.to, props.from, continentBases]);

    function handleBaseChange(
        value: SelectedOptionValue | SelectedOptionValue[]
    ) {
        props.dispatch({
            type: "update",
            id: props.id,
            facility: value as unknown as number,
        });
    }

    const searchOptions = useMemo(
        () =>
            continentBases.map((base) => {
                return {
                    value: base.id,
                    name: base.name,
                    disabled:
                        base.id in availableBases
                            ? !availableBases[base.id]
                            : false,
                };
            }),
        [continentBases]
    );

    return (
        <div className="container relative col-span-6">
            {props.canDelete ? (
                <button
                    type="button"
                    onClick={() =>
                        props.dispatch({ type: "delete", id: props.id })
                    }
                    className="absolute top-0 right-0 flex h-5 w-5 place-content-center rounded-full bg-red-600 hover:bg-red-700"
                >
                    <XIcon className="h-4 w-4 pt-1" />
                </button>
            ) : null}
            <fieldset
                name={`base-${props.id}`}
                className="mr-2 mt-2 grid grid-cols-6 gap-6 rounded-lg border border-solid border-gray-300 p-3 shadow"
            >
                <div className="col-span-6 sm:col-span-2 sm:col-start-1">
                    <label
                        htmlFor="continent"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Continent
                    </label>
                    <select
                        id="continent"
                        onChange={(event) => setContinent(event.target.value)}
                        value={continent}
                        className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                    >
                        <option value="Indar">Indar</option>
                        <option value="Amerish">Amerish</option>
                        <option value="Esamir">Esamir</option>
                        <option value="Hossin">Hossin</option>
                        <option value="Oshur">Oshur</option>
                    </select>
                </div>
                <div className="col-span-6 sm:col-span-6 lg:col-span-3">
                    <label
                        htmlFor="base"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Base
                    </label>
                    <SelectSearch
                        options={searchOptions}
                        search
                        emptyMessage={"No bases found"}
                        autoComplete="off"
                        placeholder="Select a base"
                        value={`${props.facilityID}`}
                        onChange={handleBaseChange}
                        filterOptions={(options) => {
                            return (query: string) => {
                                if (query.length === 0) return options;

                                const searchResult = baseIndex.search(
                                    query,
                                    10,
                                    {
                                        suggest: true,
                                    }
                                );

                                if (searchResult.length === 0) return [];

                                const searchBases = options.filter((option) =>
                                    searchResult[0].result.includes(
                                        option.value
                                    )
                                );

                                return searchBases;
                            };
                        }}
                        renderValue={(valueProps, snapshot, selectedValue) => {
                            return (
                                <input
                                    id="bases"
                                    {...valueProps}
                                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                                />
                            );
                        }}
                    ></SelectSearch>
                    <input
                        type="hidden"
                        name="bases"
                        value={
                            props.facilityID
                                ? props.facilityID.toString()
                                : "some base"
                        }
                    ></input>
                </div>
            </fieldset>
        </div>
    );
}
