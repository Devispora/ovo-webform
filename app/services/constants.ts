export type Base = {
    name: string;
    id: number;
};

export type Continent = "Indar" | "Oshur" | "Esamir" | "Amerish" | "Hossin";

export const ContinentIDMapping: { [K in Continent]: number } = {
    Indar: 2,
    Hossin: 4,
    Amerish: 6,
    Esamir: 8,
    Oshur: 334,
};
