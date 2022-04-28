export enum ErrorCode {
    FETCH_ERROR = 'FETCH_ERROR',
    SERVER = 'SOMETHING_WENT_WRONG',
    NOT_FOUND = 'NOT_FOUND',
}

export interface IBotError {
    code: ErrorCode,
}

export class DiscordBotError extends Error implements IBotError {
    readonly code: ErrorCode;

    constructor(code: ErrorCode, message?: string) {
        message ?
            super(message) :
            super(code);

        this.code = code;
    }
}
