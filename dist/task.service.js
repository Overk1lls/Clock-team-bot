"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TaskService {
    constructor(timer, callback, ...callbackArgs) {
        this.ifBusy = () => {
            return this._task.hasRef();
        };
        this._task = setInterval(() => {
            callback(callbackArgs);
        }, timer);
    }
}
exports.default = TaskService;
;
