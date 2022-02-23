import { consoleLog } from "../lib/utils";

export default class TaskService {
    private _task: NodeJS.Timer;

    constructor() { }

    createTask = (timer: number, callback: Function, ...callbackArgs: any[]) => {
        this._task = setInterval(() => {
            consoleLog('works')
            callback(callbackArgs);
        }, timer);
        console.log(this._task.hasRef());
    };

    isBusy = () => {
        return this._task.hasRef();
    };
};