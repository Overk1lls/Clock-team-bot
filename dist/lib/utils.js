"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.consoleLog = exports.fetchAPI = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const fetchAPI = (url, method = 'GET', bearer = '', body, authorization = 'Bearer ' + bearer, contentType = 'application/json') => __awaiter(void 0, void 0, void 0, function* () {
    return yield (0, node_fetch_1.default)(url, {
        method,
        headers: {
            Authorization: authorization,
            'Content-Type': contentType
        },
        body
    })
        .then((res) => res.json())
        .catch((err) => console.log(err.message));
});
exports.fetchAPI = fetchAPI;
const consoleLog = (text) => {
    const currDate = new Date();
    console.log(currDate.getHours() + ':' +
        currDate.getMinutes() + ':' +
        currDate.getSeconds() + ':' +
        ` ${text}`);
};
exports.consoleLog = consoleLog;
