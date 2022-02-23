import { User } from "discord.js"

export class UserRepository {
    private readonly _listeners: User[];

    constructor() {
        this._listeners = [] as User[];
    };

    push(user: User) {
        this._listeners.push(user);
    }

    has(user: User) {
        return this._listeners.includes(user);
    }

    public get users(): User[] {
        return this._listeners;
    }
};