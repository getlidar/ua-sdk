var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import axios from "axios";
import { DisableDataSettings, fingerprint } from "./index";
import { v4 } from 'uuid';
import ExecutionEnvironment from 'exenv';
import { version } from './version';
const fpApiKey = '1V2jYOavAUDljc9GxEgu';
export class Base {
    constructor(apiKey, gameId) {
        if (!apiKey || apiKey === '') {
            throw new Error('API Key is required to initiate Helika SDK instance.');
        }
        if (!gameId || gameId === '') {
            throw new Error('Game ID is required to initiate Helika SDK instance.');
        }
        this.apiKey = apiKey;
        this.sessionID = null;
        this.gameId = gameId;
        this.sessionExpiry = new Date();
        this.baseUrl = "http://localhost:3000";
        this.disabledDataSettings = DisableDataSettings.None;
        this.enabled = true;
    }
    isEnabled() {
        return this.enabled;
    }
    setEnabled(enabled) {
        this.enabled = enabled;
    }
    fingerprint() {
        return __awaiter(this, void 0, void 0, function* () {
            let loadOptions = {
                apiKey: fpApiKey,
                scriptUrlPattern: [
                    `https://yard.helika.io/8nc7wiyuwhncrhw3/01cb9q093c?apiKey=${fpApiKey}&version=<version>&loaderVersion=<loaderVersion>`,
                    fingerprint.defaultScriptUrlPattern, // Fallback to default CDN in case of error
                ],
                endpoint: [
                    'https://yard.helika.io/8nc7wiyuwhncrhw3/o9wn3zvyblw3v8yi8?region=us',
                    fingerprint.defaultEndpoint // Fallback to default endpoint in case of error
                ],
            };
            let fingerprintData = null;
            try {
                let loaded = yield fingerprint.load(loadOptions);
                fingerprintData = yield loaded.get();
                return {
                    fingerprint_id: fingerprintData === null || fingerprintData === void 0 ? void 0 : fingerprintData.visitorId,
                    request_id: fingerprintData === null || fingerprintData === void 0 ? void 0 : fingerprintData.requestId
                };
            }
            catch (e) {
                console.error('Error loading fingerprint data');
                return {};
            }
        });
    }
    fullFingerprint() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let loadOptions = {
                    apiKey: fpApiKey,
                    scriptUrlPattern: [
                        `https://yard.helika.io/8nc7wiyuwhncrhw3/01cb9q093c?apiKey=${fpApiKey}&version=3&loaderVersion=3.8.6`,
                        fingerprint.defaultScriptUrlPattern, // Fallback to default CDN in case of error
                    ],
                    endpoint: [
                        'https://yard.helika.io/8nc7wiyuwhncrhw3/o9wn3zvyblw3v8yi8?region=us',
                        fingerprint.defaultEndpoint // Fallback to default endpoint in case of error
                    ],
                };
                let loaded = yield fingerprint.load(loadOptions);
                let fingerprintData = yield loaded.get({
                    extendedResult: true
                });
                if (this.disabledDataSettings & DisableDataSettings.BrowserInfo) {
                    fingerprintData.browserName = "";
                    fingerprintData.browserVersion = "";
                    fingerprintData.incognito = false;
                }
                if (this.disabledDataSettings & DisableDataSettings.DeviceInfo) {
                    fingerprintData.device = "";
                }
                if (this.disabledDataSettings & DisableDataSettings.IpInfo) {
                    fingerprintData.ip = "";
                    fingerprintData === null || fingerprintData === void 0 ? true : delete fingerprintData.ipLocation;
                }
                if (this.disabledDataSettings & DisableDataSettings.OsInfo) {
                    fingerprintData.os = "";
                    fingerprintData.osVersion = "";
                }
                // if (this.disabledDataSettings & DisableDataSettings.VpnInfo) {
                //   // Not here
                // }
                return fingerprintData;
            }
            catch (e) {
                console.error('Error loading fingerprint data');
                return {};
            }
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
    updateUtms() {
        let newUtms = this.getAllUrlParams();
        if (newUtms) {
            localStorage.setItem('helika_utms', JSON.stringify(newUtms));
        }
    }
    updateLinkId() {
        let helika_referral_link = this.getUrlParam('linkId');
        if (helika_referral_link) {
            localStorage.setItem('helika_referral_link', helika_referral_link ? helika_referral_link : '');
        }
    }
    updateUtmsAndLinkIdIfNecessary() {
        let storedLinkId = localStorage.getItem('helika_referral_link');
        let newLinkId = this.getUrlParam('linkId');
        if (!storedLinkId ||
            (newLinkId && (newLinkId === null || newLinkId === void 0 ? void 0 : newLinkId.trim().length) > 0 && (storedLinkId === null || storedLinkId === void 0 ? void 0 : storedLinkId.trim()) !== (newLinkId === null || newLinkId === void 0 ? void 0 : newLinkId.trim()))) {
            this.updateLinkId();
            this.updateUtms();
        }
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
            axios
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
            if (!this.enabled) {
                console.log("Body: ", options);
                resolve({ message: 'Logged event' });
            }
            else {
                axios
                    .post(`${url}`, options, config)
                    .then((resp) => {
                    resolve(resp.data);
                })
                    .catch(reject);
            }
        });
    }
    sessionCreate(params) {
        return __awaiter(this, void 0, void 0, function* () {
            this.sessionID = v4();
            this.sessionExpiry = this.addMinutes(new Date(), 15);
            let fpData = {};
            let utms = null;
            let helika_referral_link = null;
            try {
                if (ExecutionEnvironment.canUseDOM) {
                    if (params.type === 'Session Start') {
                        let local_session_id = localStorage.getItem('sessionID');
                        let expiry = localStorage.getItem('sessionExpiry');
                        if (local_session_id && expiry && (new Date(expiry) > new Date())) {
                            this.sessionID = local_session_id;
                            localStorage.setItem('sessionExpiry', this.sessionExpiry.toString());
                            this.updateUtmsAndLinkIdIfNecessary();
                            return;
                        }
                        else {
                            // Only grab fingerprint data if it's a new session
                            fpData = yield this.fullFingerprint();
                        }
                    }
                    localStorage.setItem('sessionID', this.sessionID);
                    localStorage.setItem('sessionExpiry', this.sessionExpiry.toString());
                    utms = this.getAllUrlParams();
                    helika_referral_link = this.getUrlParam('linkId');
                    if (utms) {
                        localStorage.setItem('helika_utms', JSON.stringify(utms));
                    }
                    if (helika_referral_link) {
                        localStorage.setItem('helika_referral_link', helika_referral_link);
                    }
                }
            }
            catch (e) {
                console.error(e);
            }
            //send event to initiate session
            var initevent = {
                created_at: new Date().toISOString(),
                game_id: this.gameId,
                event_type: 'session_created',
                event: {
                    type: params.type,
                    sdk_name: "Web",
                    sdk_version: version,
                    sdk_class: params.sdk_class,
                    fp_data: fpData,
                    helika_referral_link: helika_referral_link,
                    session_id: this.sessionID,
                    utms: utms,
                    event_sub_type: 'session_created'
                }
            };
            let event_params = {
                id: this.sessionID,
                events: [initevent]
            };
            try {
                return yield this.postRequest(`/game/game-event`, event_params);
            }
            catch (e) {
                if (e && 'response' in e && 'data' in e.response && 'message' in e.response.data &&
                    e.response.data.message.startsWith('Internal server error - Invalid API key:')) {
                    this.sessionID = null;
                    if (ExecutionEnvironment.canUseDOM) {
                        localStorage.removeItem('sessionID');
                    }
                    throw new Error('Error: Invalid API key. Please re-initiate the Helika SDK with a valid API Key.');
                }
                throw new Error(e.message);
            }
        });
    }
    addHours(date, hours) {
        date.setHours(date.getHours() + hours);
        return date.toString();
    }
    addMinutes(date, minutes) {
        date.setMinutes(date.getMinutes() + minutes);
        return date.toString();
    }
    extendSession() {
        this.sessionExpiry = this.addMinutes(new Date(), 15);
        if (ExecutionEnvironment.canUseDOM) {
            localStorage.setItem('sessionExpiry', this.sessionExpiry);
        }
        ;
    }
    setDataSettings(settings) {
        this.disabledDataSettings = settings;
    }
}
