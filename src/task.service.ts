import { User } from "discord.js";
import DiscordService from "./discord.service";
import FetchBlizzardService from "./fetchBlizzard.service";
import { responses } from "./lib/config";
import { consoleLog } from "./lib/utils";

export default class TaskService {
    private _task: NodeJS.Timer;

    constructor(timer: number, callback: Function, ...callbackArgs: any[]) {
        this._task = setInterval(() => {
            callback(callbackArgs);
        }, timer);
    }

    ifBusy = () => {
        return this._task.hasRef();
    };
};