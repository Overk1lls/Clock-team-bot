import fetch from 'node-fetch';

export const fetchAPI = async (
    url: string,
    method = 'GET',
    bearer = '',
    body?: any,
    authorization = 'Bearer ' + bearer,
    contentType = 'application/json',
) => {
    return await fetch(url, {
        method,
        headers: {
            Authorization: authorization,
            'Content-Type': contentType
        },
        body
    })
        .then((res: Response) => res.json())
        .catch((err: Error) => console.log(err.message));
};

export const consoleLog = (text: string) => {
    const currDate = new Date();
    console.log(
        `${currDate.getHours()}:${currDate.getMinutes()}:${currDate.getSeconds()} ${text}`
    );
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