import { HeadersInit } from 'node-fetch';

export class BlizzardService {
    private _blizzardAuthToken: string;
    private _headers: HeadersInit;

    constructor(blizzAuthToken: string) {
        this._blizzardAuthToken = blizzAuthToken;
    }

    start = async () => {
        const url = 'https://eu.battle.net/oauth/token';
        const method = 'POST';
        this._headers = {
            'Authorization': `Basic ${this._blizzardAuthToken}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        };
        const body = 'grant_type=client_credentials';

        await this.fetchAPI({
            url,
            method,
            body
        }).then((token: Record<string, string>) => {
            this._headers = {
                'Authorization': `Bearer ${token.access_token}`,
                'Content-Type': 'application/json'
            };
        });

        setTimeout(() => this.start(), 86000 * 1000);
    };

    getRIO = (
        nickname: string,
        realm: string,
        region: string,
        fields = 'mythic_plus_recent_runs'
    ) => {
        const url = `https://raider.io/api/v1/characters/profile?region=${region}&realm=${realm}&name=${nickname}&fields=${fields}`;
        return this.fetchAPI({ url });
    };

    getRealm = (
        region: string,
        realm: string
    ) => {
        const url = `https://${region}.api.blizzard.com/data/wow/realm/${realm}?namespace=dynamic-${region}`;
        return this.fetchAPI({ url });
    };

    getConnectedRealm = ({
        link,
        region,
        realm
    }: {
        link?: string,
        region?: string,
        realm?: string
    }) => {
        const url = `https://${region}.api.blizzard.com/data/wow/connected-realm/${realm}?namespace=dynamic-${region}`;
        return link ?
            this.fetchAPI({ url: link }) :
            this.fetchAPI({ url });
    };

    getGameToken = (region: string) => {
        const url = `https://${region}.api.blizzard.com/data/wow/token/index?&namespace=dynamic-${region}`;
        return this.fetchAPI({ url });
    };

    getItem = (region: string, id: string) => {
        const url = `https://${region}.api.blizzard.com/data/wow/item/${id}?&namespace=static-${region}`;
        return this.fetchAPI({ url });
    };

    private fetchAPI = async ({
        url,
        method = 'GET',
        headers = this._headers,
        body
    }: {
        url: string,
        method?: string,
        headers?: HeadersInit,
        body?: BodyInit
    }) => fetch(
        url,
        {
            method,
            headers,
            body
        }
    ).then((res: Response) => res.json());
}
