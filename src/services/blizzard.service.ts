import { fetchAPI } from "../lib/utils";

export class BlizzardService {
    private _blizzardToken: string;
    private _refreshTokenTimer: NodeJS.Timer;

    constructor() { }

    setup = async (blizzAuthToken: string) => {
        const url = 'https://eu.battle.net/oauth/token';
        const method = 'POST';
        const body = 'grant_type=client_credentials';
        const headers = {
            authorization: 'Basic ' + blizzAuthToken,
            contentType: 'application/x-www-form-urlencoded'
        };

        await fetchAPI(
            url,
            method,
            blizzAuthToken,
            body,
            headers.authorization,
            headers.contentType
        ).then((token: any) => this._blizzardToken = token.access_token);

        setTimeout(() => this.setup(blizzAuthToken), 86000 * 1000);
    };

    fetchRIO = (
        nickname: string,
        realm: string,
        region: string,
        fields = 'mythic_plus_recent_runs'
    ) => {
        const url = `https://raider.io/api/v1/characters/profile?region=${region}&realm=${realm}&name=${nickname}&fields=${fields}`;
        return fetchAPI(url);
    };

    fetchRealmData = (
        region: string,
        realm: string
    ) => {
        const url = `https://${region}.api.blizzard.com/data/wow/realm/${realm}?namespace=dynamic-${region}`;
        return fetchAPI(url, 'GET', this._blizzardToken);
    };

    fetchRealm = (
        region: string,
        realm: string
    ) => {
        const url = `https://${region}.api.blizzard.com/data/wow/connected-realm/${realm}?namespace=dynamic-${region}`;
        return fetchAPI(url, 'GET', this._blizzardToken);
    };

    fetchGameToken = (region: string) => {
        const url = `https://${region}.api.blizzard.com/data/wow/token/index?&namespace=dynamic-${region}`;
        return fetchAPI(url, 'GET', this._blizzardToken);
    };

    fetchItem = (region: string, id: string) => {
        const url = `https://${region}.api.blizzard.com/data/wow/item/${id}?&namespace=static-${region}`;
        return fetchAPI(url, 'GET', this._blizzardToken);
    };
};