export interface IRealmData {
    connected_realm: {
        href: string,
    },
    code?: number,
}

export type RealmData = IRealmData & Record<string, unknown>;
