export interface IRealmData {
    connected_realm: {
        href: string,
    },
}

export type RealmData = IRealmData & Record<string, unknown>;
