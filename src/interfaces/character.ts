export default interface ICharacter {
    character: string,
    fraction: string,
    reputations: [{
        name: string,
        value: string,
        valueMax: string,
        valueName: string,
        tier: Number
    }];
}