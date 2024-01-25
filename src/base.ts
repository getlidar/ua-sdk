import { DisableDataSettings } from "./index";
import { v4 } from 'uuid';
import { version } from './version'

const fpApiKey = '1V2jYOavAUDljc9GxEgu';

export abstract class Base {
  private apiKey: string;
  protected baseUrl: string;
  protected gameId: string;
  protected sessionID: string | null;
  protected sessionExpiry: any;
  protected disabledDataSettings: DisableDataSettings;
  protected enabled: boolean;
  protected fingerprintJS: any;
  protected ExecutionEnvironment: any;
  protected axios: any;

  constructor(apiKey: string, gameId: string, fingerprintJS: any, ExecutionEnvironment: any, axios: any) {
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
    this.fingerprintJS = fingerprintJS;
    this.ExecutionEnvironment = ExecutionEnvironment;
    this.axios = axios;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  protected async fullFingerprint(): Promise<any> {
    try {

      let loadOptions = {
        apiKey: fpApiKey,
        scriptUrlPattern: [
          `https://yard.helika.io/8nc7wiyuwhncrhw3/01cb9q093c?apiKey=${fpApiKey}&version=3&loaderVersion=3.8.6`,
          this.fingerprintJS.defaultScriptUrlPattern, // Fallback to default CDN in case of error
        ],
        endpoint: [
          'https://yard.helika.io/8nc7wiyuwhncrhw3/o9wn3zvyblw3v8yi8?region=us',
          this.fingerprintJS.defaultEndpoint // Fallback to default endpoint in case of error
        ],
      };
      let loaded = await this.fingerprintJS.load(loadOptions);
      let fingerprintData = await loaded.get({
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
        delete fingerprintData?.ipLocation;
      }

      if (this.disabledDataSettings & DisableDataSettings.OsInfo) {
        fingerprintData.os = "";
        fingerprintData.osVersion = "";
      }

      // if (this.disabledDataSettings & DisableDataSettings.VpnInfo) {
      //   // Not here
      // }

      return fingerprintData;
    } catch (e) {
      console.error('Error loading fingerprint data');
      return {};
    }
  }

  protected getUrlParam(paramName: string) {
    var urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(paramName);
  }

  protected getAllUrlParams() {
    let url = window.location.href;

    if (url.indexOf('?') != -1) {
      var params = url.split('?')[1].split('&');
      return params.map(pair => {
        let values = pair.split('=');
        return {
          key: values[0],
          value: values[1]
        }
      });
    }
    return [];
  }

  protected getRequest<T>(endpoint: string, options?: any): Promise<T> {
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
      this.axios
        .get(`${url}`, config)
        .then((resp: any) => {
          resolve(resp.data);
        })
        .catch(reject);
    });
  }

  protected postRequest<T>(endpoint: string, options?: any): Promise<any> {
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
      } else {
        this.axios
          .post(`${url}`, options, config)
          .then((resp: any) => {
            resolve(resp.data);
          })
          .catch(reject);
      }
    });
  }

  protected async sessionCreate<T>(params?: any): Promise<any> {

    this.sessionID = v4();
    this.sessionExpiry = this.addHours(new Date(), 6);
    let fpData = {};
    let utms: any = null;
    let helika_referral_link: any = null;
    try {
      if (this.ExecutionEnvironment.canUseDOM) {
        if (params.type === 'Session Start') {
          let local_session_id = localStorage.getItem('sessionID');
          let expiry = localStorage.getItem('sessionExpiry');
          if (local_session_id && expiry && (new Date(expiry) > new Date())) {
            this.sessionID = local_session_id;
          } else {
            // Only grab fingerprint data if it's a new session
            fpData = await this.fullFingerprint();
          }
        }

        localStorage.setItem('sessionID', this.sessionID);
        localStorage.setItem('sessionExpiry', this.sessionExpiry.toString());
        utms = this.getAllUrlParams();
        helika_referral_link = this.getUrlParam('linkId');
        if (utms) {
          localStorage.setItem('helika_utms', JSON.stringify(utms))
        }
        if (helika_referral_link) {
          localStorage.setItem('helika_referral_link', helika_referral_link);
        }
      }
    } catch (e) {
      console.error(e);
    }

    //send event to initiate session
    var initevent = {
      created_at: new Date().toISOString(),
      game_id: 'helika_sdk',
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
    }

    try {
      return await this.postRequest(`/game/game-event`, event_params);
    } catch (e: any) {
      if (
        e && 'response' in e && 'data' in e.response && 'message' in e.response.data &&
        e.response.data.message.startsWith('Internal server error - Invalid API key:')
      ) {
        this.sessionID = null;
        if (this.ExecutionEnvironment.canUseDOM) {
          localStorage.removeItem('sessionID');
        }
        throw new Error('Error: Invalid API key. Please re-initiate the Helika SDK with a valid API Key.');
      }
      throw new Error(e.message);
    }

  }

  protected addHours(date: Date, hours: number) {
    date.setHours(date.getHours() + hours);
    return date.toString();
  }

  protected extendSession() {
    this.sessionExpiry = this.addHours(new Date(), 6);
    if (this.ExecutionEnvironment.canUseDOM) {
      localStorage.setItem('sessionExpiry', this.sessionExpiry);
    };
  }

  public setDataSettings(settings: DisableDataSettings) {
    this.disabledDataSettings = settings;
  }
}
