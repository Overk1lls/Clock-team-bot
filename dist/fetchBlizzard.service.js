"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./lib/utils");
class FetchBlizzardService {
    constructor(blizzAuthToken) {
        this.fetchRIO = (character, realm, region, fields = 'mythic_plus_recent_runs') => {
            const url = `https://raider.io/api/v1/characters/profile?region=${region}&realm=${realm}&name=${character}&fields=${fields}`;
            return (0, utils_1.fetchAPI)(url);
        };
        this.fetchRealmData = (region, realm) => {
            const url = `https://${region}.api.blizzard.com/data/wow/realm/${realm}?namespace=dynamic-${region}`;
            return (0, utils_1.fetchAPI)(url, 'GET', this._blizzardToken);
        };
        this.fetchRealmStatus = (region, realm) => {
            const url = `https://${region}.api.blizzard.com/data/wow/connected-realm/${realm}?namespace=dynamic-${region}`;
            return (0, utils_1.fetchAPI)(url, 'GET', this._blizzardToken);
        };
        const url = 'https://eu.battle.net/oauth/token';
        const method = 'POST';
        const body = 'grant_type=client_credentials';
        const headers = {
            authorization: 'Basic ' + blizzAuthToken,
            contentType: 'application/x-www-form-urlencoded'
        };
        (0, utils_1.fetchAPI)(url, method, blizzAuthToken, body, headers.authorization, headers.contentType)
            .then(token => this._blizzardToken = token.access_token)
            .then(token => console.log(this._blizzardToken));
    }
}
exports.default = FetchBlizzardService;
;
