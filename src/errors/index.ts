import { IBotError } from "../interfaces/error.interface";

export enum ErrorCode {
    FETCH_ERROR = 'FETCH_ERROR',
    SERVER = 'SERVER',
    NOT_FOUND = 'NOT_FOUND'
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