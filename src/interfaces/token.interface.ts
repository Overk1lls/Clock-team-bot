export interface IToken {
    price: number,
    code: number,
}

export type Token = IToken & Record<string, unknown>;
