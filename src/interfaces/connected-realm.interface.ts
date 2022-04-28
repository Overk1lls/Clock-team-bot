export interface IConnectedRealm {
    status: {
        type: 'DOWN' | 'UP',
    },
    auctions: {
        href: string,
    },
    code?: number,
}

export type ConnectedRealm = IConnectedRealm & Record<string, unknown>;
