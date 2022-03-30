export interface IRealms {
    _links: {
        self: {
            href: string;
        }
    },
    realms: [{
        key: {
            href: string;
        },
        name: string;
        id: number;
        slug: string;
    }]
}
