export interface IKey {
    shortName: string;
    mythicLevel: number;
    upgrades: number;
    url: string;
    completeDate: Date;
}

export type Key = IKey & { [key: string]: unknown };
