import axios, { AxiosRequestHeaders, Method } from 'axios';
import { DiscordBotError, ErrorCode } from './error.service';
import { IRealmData } from '../interfaces/realm.interface';
import { IConnectedRealm } from '../interfaces/connected-realm.interface';
import { IAuction, IRealms, IToken } from '../interfaces';
import { BlizzTokenDTO } from '../interfaces/dto/blizz-token.dto';
import { logWithDate } from '../lib/utils';
import { IRioChar } from '../interfaces/dto/rio.dto';

export class BlizzardService {
    private readonly blizzardAuthToken: string;
    private headers: AxiosRequestHeaders;

    constructor(blizzAuthToken: string) {
        this.blizzardAuthToken = blizzAuthToken;
    }

    start = async () => {
        const url = 'https://eu.battle.net/oauth/token';
        const method = 'POST';
        this.headers = {
            'Authorization': `Basic ${this.blizzardAuthToken}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        };
        const data = 'grant_type=client_credentials';

        this.fetchAPI({
            url,
            method,
            data
        }).then((token: BlizzTokenDTO) => {
            this.headers = {
                'Authorization': `Bearer ${token.access_token}`,
                'Content-Type': 'application/json'
            };
            logWithDate('Blizzard Service is ready');
        });

        setTimeout(() => this.start(), 86000 * 1000);
    };

    getRIO = ({
        nickname,
        realm,
        region = 'us',
        fields = 'mythic_plus_recent_runs'
    }: {
        nickname: string,
        realm: string,
        region?: 'us' | 'eu',
        fields?: string
    }): Promise<IRioChar> => {
        const url = `https://raider.io/api/v1/characters/profile?region=${region}&realm=${realm}&name=${nickname}&fields=${fields}`;
        return this.fetchAPI({ url });
    };

    getRealm = (
        region: string,
        realm: string
    ): Promise<IRealmData> => {
        const url = `https://${region}.api.blizzard.com/data/wow/realm/${realm}?namespace=dynamic-${region}`;
        return this.fetchAPI({ url });
    };

    getRealms = (region: string): Promise<IRealms> => {
        const url = `https://${region}.api.blizzard.com` +
            `/data/wow/realm/index?namespace=dynamic-${region}`;
        return this.fetchAPI({ url });
    };

    getAuction = ({
        region = 'us',
        id
    }: {
        region?: string,
        id: number
    }): Promise<IAuction> => {
        const url = `https://${region}.api.blizzard.com` +
            `/data/wow/connected-realm/${id}/auctions?namespace=dynamic-${region}`;
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
    }): Promise<IConnectedRealm> => {
        const url = `https://${region}.api.blizzard.com/data/wow/connected-realm/${realm}?namespace=dynamic-${region}`;
        return link ?
            this.fetchAPI({ url: link }) :
            this.fetchAPI({ url });
    };

    getGameToken = (region: string): Promise<IToken> => {
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
        headers = this.headers,
        data
    }: {
        url: string,
        method?: Method,
        headers?: AxiosRequestHeaders,
        data?: BodyInit
    }) => axios(url, {
        method,
        headers,
        data
    }).then(res => {
        if (res.status >= 400) {
            throw new DiscordBotError(ErrorCode.FETCH_ERROR);
        }
        return res.data;
    });
}
