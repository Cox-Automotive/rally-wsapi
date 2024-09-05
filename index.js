const axios = require("axios");
const { CookieJar } = require("tough-cookie");
const { wrapper } = require("axios-cookiejar-support");
const { isObject, isString, isBool } = require("./src/utils");
const { where } = require("./src/query");
const { RallyLog } = require("./src/logs");
const { RallyParam } = require("./src/param");
const { RallyError, ErrMsg } = require("./src/error");

/**
 * Rally WSAPI for Node.js
 *
 * This library borrows from the original (and outdated) Rally/CA/Broadcom code and
 * seeks to provide a more minimal implementation with fewer dependencies and no
 * security vulnerabilities from `requests` and other legacy code. Specifically
 * dropping Lodash and Request in favor of modern Axios using Async / Await.
 */

class RallyClient {
  constructor(config) {
    this.settings = {
      server: "https://rally1.rallydev.com",
      serverPath: "/slm/webservice/",
      apiVersion: "v2.0",
      sortOrderDir: "asc",
      startIndex: 1,
      pageSize: 20,
      workspace: "",
      debug: false,
    };

    this.client = {
      rallyIntName: "",
      rallyIntVendor: "",
      rallyIntVersion: "1.0.0",
      rallyIntOS: "Linux",
      rallyIntPlatform: "Node",
      rallyIntLibrary: "Rally WSAPI for Node.js",
    };

    this.auth = {
      key: null,
      user: null,
      pass: null,
      mode: null,
    };

    this.wsapi = {
      http: null,
      util: null,
      baseURL: "",
    };

    const debugEnvs = process.env.DEBUG?.toLowerCase() === "true" || false;
    const debugConf = config?.debug === true || false;

    if (debugEnvs || debugConf) {
      this.settings.debug = true;
      process.env.DEBUG = true;
    }

    this.logger = new RallyLog();
    this.logger.log(`Config: ${JSON.stringify(config)}`);
    this.configureSettingsOverrides(config);
  }

  /**
   * Override default settings with the config object values
   * @param {*} config
   */
  configureSettingsOverrides(config) {
    if (isObject(config)) {
      for (const key in config) {
        if (this.settings.hasOwnProperty(key)) {
          this.settings[key] = config[key];
        }

        if (key === "client") {
          for (const hkey in config.client) {
            if (this.client.hasOwnProperty(hkey)) {
              this.client[hkey] = config.client[hkey];
            }
          }

          delete config.client;
        }

        if (key === "auth") {
          for (const akey in config.auth) {
            if (this.auth.hasOwnProperty(akey)) {
              this.auth[akey] = config.auth[akey];
            }
          }

          delete config.auth;
        }
      }
    }

    this.wsapi.baseURL = `${this.settings.server}${this.settings.serverPath}${this.settings.apiVersion}`;
    this.wsapi.util = new RallyParam(this.settings);

    this.logger.log(`Settings : ${JSON.stringify(this.settings)}`);
    this.configureRestClient(config);
  }

  /**
   * Apply default headers and settings to Axios including X-Rally integration
   * This has only been tested using a Rally API key, YMMV on basic auth.
   * @param {*} config
   */
  configureRestClient(config) {
    const env_user = process.env.RALLY_USERNAME || null;
    const env_pass = process.env.RALLY_PASSWORD || null;
    const env_zkey = process.env.RALLY_API_KEY || null;

    const user = config?.auth?.user || env_user;
    const pass = config?.auth?.pass || env_pass;

    if (!this.auth.key && env_zkey) {
      this.auth.key = env_zkey;
    }

    if (user && pass) {
      axios.defaults.auth = { username: user, password: pass };
      this.auth.mode = "basic";
    }

    axios.defaults.headers.common = config?.headers || {};
    axios.defaults.headers.common["Content-Type"] = config?.contentType || "application/json";

    if (this.auth.key) {
      axios.defaults.headers.common["ZSESSIONID"] = this.auth.key;
      this.auth.mode = "apikey";
    }

    axios.defaults.baseURL = this.wsapi.baseURL;
    axios.defaults.headers.common["X-RallyIntegrationName"] = this.client.rallyIntName;
    axios.defaults.headers.common["X-RallyIntegrationVendor"] = this.client.rallyIntVendor;
    axios.defaults.headers.common["X-RallyIntegrationVersion"] = this.client.rallyIntVersion;
    axios.defaults.headers.common["X-RallyIntegrationOS"] = this.client.rallyIntOS;
    axios.defaults.headers.common["X-RallyIntegrationPlatform"] = this.client.rallyIntPlatform;
    axios.defaults.headers.common["X-RallyIntegrationLibrary"] = this.client.rallyIntLibrary;

    const jar = new CookieJar();
    this.wsapi.http = wrapper(axios.create({ jar }));
    this.wsapi.http.defaults.timeout = config?.timeout || 0;
  }

  /**
   * When basic auth is used, non-get requests must have a new SecurityToken for each request
   * This has not been throughly tested, YMMV.
   * @returns SecurityToken
   */
  async authorize() {
    let token = false;

    if (this.auth.mode === "basic") {
      try {
        const resp = await this.wsapi.http.get("/security/authorize");

        if (resp.status === 200) {
          const tokenResp = resp?.data?.SecurityToken || null;
          const opertResp = resp?.data?.OperationResult?.SecurityToken || null;

          if (tokenResp || opertResp) {
            token = tokenResp || opertResp;
          }
        } else {
          this.logger.error(`Authorize response ${resp.status}`);
          throw new RallyError(resp.status, "Auth", ErrMsg.BASIC_AUTH_ERR);
        }
      } catch (error) {
        this.logger.error(`Authorize error ${error.status}`);
        throw new RallyError(error.status, "Auth", ErrMsg.BASIC_AUTH_ERR);
      }
    }

    return token;
  }


  /**
   * To perform a configured query against the WSAPI, all options must be passed in.
   * AutoParams is on by default and will inject the configured workspace and
   * format inputs like 'fetch' from an array to a comma-delimited lists.
   * Paging defaults are also set if not provided to reduce payloads.
   * @param {*} options 
   * @param {*} autoparams 
   * @returns 
   */
  async request(options, autoparams) {
    const localOptions = JSON.parse(JSON.stringify(options));
    this.logger.log(`Query: Init`);

    const parseParams = (isBool(autoparams) && autoparams === false) ? false : true;
    this.logger.log(`Query: AutoParse = ${parseParams}`);

    let respData = {};

    try {
      if (this.auth.mode === "basic" && method !== "get") {
        this.logger.log(`Query: Getting basic auth token`);
        const tokenResp = await this.authorize();

        if (tokenResp !== false) {
          this.logger.log(`Success`);
          localOptions.key = tokenResp;
        } else {
          this.logger.log(`Failed`);
        }
      }

      this.logger.log(`Query: Ref check`);
      if (localOptions?.ref) {
        if( isObject(localOptions.ref) && isString(localOptions.ref?._ref) && localOptions.ref?._ref?.startsWith(this.wsapi.baseURL) ) {
          const relativePath = localOptions.ref._ref.replace(this.wsapi.baseURL, '');
          localOptions.url = relativePath;
        }
        delete localOptions.ref;
      }

      this.logger.log(`Query: Parameter check`);
      if (localOptions?.params && parseParams) {
        localOptions.params = this.wsapi.util.queryParams(localOptions.params);
      }

      this.logger.log(`Query: ${JSON.stringify(localOptions)}`);
      const resp = await this.wsapi.http.request(localOptions);

      this.logger.log(`Query: Success ${resp.status}`);
      this.logger.log(`Query: Headers ${JSON.stringify(resp.config?.headers || {})}`);

      if( Object.keys(resp).length == 1 ) {
        // Automatically unpack the response
        const key = Object.keys(resp)[0];
        const data = resp[key];
        data['ResponseType'] = key;

        if (data?.Errors && data.Errors.length > 0) {
          respData.error = data.Errors;
        } else {
          respData.error = null;
        }

        respData.response = data;
      } else {
        respData.response = resp;
        respData.error = null;
      }
    } catch (error) {
      this.logger.error(`Query: Error ${error.message}`);
      respData.response = null;
      respData.error = error;
    }

    return respData;
  }
}

module.exports.RallyClient = RallyClient;
module.exports.RallyQuery = { where };
