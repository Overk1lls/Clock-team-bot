export interface IConnectedRealm {
    status: {
        type: string
    },
    auctions: {
        href: string,
    },
}

export type ConnectedRealm = IConnectedRealm & Record<string, unknown>;
