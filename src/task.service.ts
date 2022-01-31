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