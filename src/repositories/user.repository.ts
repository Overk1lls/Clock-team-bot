import { User } from "discord.js";

export class UserRepository {
    private _listeners: Set<User>;

    constructor() {
        this._listeners = new Set<User>();
    }

    add(user: User) {
        this._listeners.add(user);
    }

    has(user: User) {
        return this._listeners.has(user);
    }

    public get users(): Set<User> {
        return this._listeners;
    }
}