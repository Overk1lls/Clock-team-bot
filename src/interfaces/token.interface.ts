export interface IToken {
    price: number,
}

export type Token = IToken & Record<string, unknown>;
