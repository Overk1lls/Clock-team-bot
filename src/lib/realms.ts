export enum DefaultRealm {
    EU = 'kazzak',
    US = 'mal\'ganis',
}

export const getRegionFromText = (text: string[]) => {
    const region = text
        .find(chunk => chunk.match(/eu|us/i))
        ?.toLocaleLowerCase();

    if (!region) return 'us';
    return region === 'eu' ? 'eu' : 'us';
};
