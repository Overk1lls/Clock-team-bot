export const consoleLog = (text: string) => {
    const curDate = new Date();
    const curHours = curDate.getHours();
    const curMinutes = curDate.getMinutes();
    const curSeconds = curDate.getSeconds();
    console.log(`${curHours}:${curMinutes}:${curSeconds} ${text}`);
};

export const getRegionFromText = (text: string[]) => {
    const region = text.filter(chunk => chunk.match(/eu|us/i))[0]?.toLocaleLowerCase();
    return region ? region : 'us';
};

export const createTask = (
    timer: number,
    callback: (...args: any[]) => unknown,
    ...callbackArgs: unknown[]
) => {
    return setInterval(() => {
        callback(...callbackArgs);
    }, timer);
};

export const isStringIncluded = (
    values: Record<string, unknown> | Enumerator<string>,
    string: string
) => {
    return Object.values(values).includes(string);
}; 