"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.Base = void 0;
const axios_1 = __importDefault(require("axios"));
const index_1 = require("./index");
const uuid_1 = require("uuid");
class Base {
    constructor(config) {
        this.apiKey = config.apiKey;
        this.sessionID = (0, uuid_1.v4)();
        switch (config.baseUrlOption) {
            case index_1.BaseURLOptions.EVENTS_LOCAL:
                this.baseUrl = 'http://localhost:8181/v1';
                return;
            case index_1.BaseURLOptions.EVENTS_MAINNET:
                this.baseUrl = 'https://api.helika.io/v1';
                return;
            case index_1.BaseURLOptions.EVENTS_TESTNET:
                this.baseUrl = 'https://api-stage.helika.io/v1';
                return;
            case index_1.BaseURLOptions.UA_LOCAL:
                this.baseUrl = 'http://localhost:3000';
                return;
            case index_1.BaseURLOptions.UA_MAINNET:
                this.baseUrl = 'https://ua-api.helika.io';
                return;
            case index_1.BaseURLOptions.UA_TESTNET:
            default:
                this.baseUrl = 'https://ua-api-dev.helika.io';
                return;
        }
    }
    getFP() {
        return new Promise((resolve, reject) => {
            // @ts-ignore Import moduleconst 
            Promise.resolve().then(() => __importStar(require('https://fpjscdn.net/v3/1V2jYOavAUDljc9GxEgu'))).then((respA) => {
                let response = respA.default;
                resolve(response);
            })
                .catch(reject);
        });
    }
    fingerprint() {
        return __awaiter(this, void 0, void 0, function* () {
            let func = yield this.getFP();
            let loaded = yield func.load();
            let fingerprintData = yield loaded.get();
            return {
                fingerprint_id: fingerprintData === null || fingerprintData === void 0 ? void 0 : fingerprintData.visitorId,
                request_id: fingerprintData === null || fingerprintData === void 0 ? void 0 : fingerprintData.requestId
            };
        });
    }
    getUrlParam(paramName) {
        var urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(paramName);
    }
    getAllUrlParams() {
        let url = window.location.href;
        if (url.indexOf('?') != -1) {
            var params = url.split('?')[1].split('&');
            return params.map(pair => {
                let values = pair.split('=');
                return {
                    key: values[0],
                    value: values[1]
                };
            });
        }
        return [];
    }
    getRequest(endpoint, options) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            "Content-Type": "application/json",
            "x-api-key": this.apiKey,
        };
        const config = {
            params: options,
            headers: headers,
        };
        return new Promise((resolve, reject) => {
            axios_1.default
                .get(`${url}`, config)
                .then((resp) => {
                resolve(resp.data);
            })
                .catch(reject);
        });
    }
    postRequest(endpoint, options) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            "Content-Type": "application/json",
            "x-api-key": this.apiKey,
        };
        const config = {
            headers,
        };
        return new Promise((resolve, reject) => {
            axios_1.default
                .post(`${url}`, options, config)
                .then((resp) => {
                resolve(resp.data);
            })
                .catch(reject);
        });
    }
}
exports.Base = Base;
