import fetch, { Response } from 'node-fetch';

export const fetchAPI = (
    url: string,
    method = 'GET',
    bearer = '',
    body?: any,
    authorization = 'Bearer ' + bearer,
    contentType = 'application/json',
) => {
    return fetch(url, {
        method,
        headers: {
            Authorization: authorization,
            'Content-Type': contentType
        },
        body
    }).then((res: Response) => res.json());
};

export const consoleLog = (text: string) => {
    const curDate = new Date();
    const curHours = curDate.getHours();
    const curMinutes = curDate.getMinutes();
    const curSeconds = curDate.getSeconds();
    console.log(`${curHours}:${curMinutes}:${curSeconds} ${text}`);
};

export const getRegionFromText = (text: string[]) => {
    const region = text.filter(chunk => chunk.match(/eu|us/i))[0];
    return region ? region : 'us';
};

export const createTask = (
    timer: number,
    callback: Function,
    ...callbackArgs: any[]
) => {
    return setInterval(() => {
        callback.apply(null, callbackArgs);
    }, timer);
};

export const isStringIncluded = (values: Object | Enumerator<string>, string: string) => {
    return Object.values(values).includes(string);
}; 