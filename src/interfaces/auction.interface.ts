export interface IAuction {
    _links: {
        self: {
            href: string;
        }
    },
    connected_realm: {
        href: string;
    },
    auctions: [{
        id: number,
        item: {
            id: number,
            context: number;
            modifiers: unknown[];
        },
        quantity: number,
        unit_price: number,
        buyout: number,
        time_left: string;
    }]
}
