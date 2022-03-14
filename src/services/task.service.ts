export default class TaskService {
    private _task: NodeJS.Timer;

    createTask = (
        timer: number,
        callback: (...args: unknown[]) => unknown,
        ...callbackArgs: unknown[]
    ) => {
        this._task = setInterval(() => {
            callback(...callbackArgs);
        }, timer);
    };

    isBusy = () => this._task.hasRef();
}
