const { isString, isBool, isNumber } = require("./utils");

/**
 * Rally WSAPI for Node.js
 * RallyParam
 *
 * This class takes an input object and ensures that the values are valid
 * and of the correct type before adding them to the parameters object.
 * This may not be a complete list of all options, but was gathered from
 * available sources.
 * 
 * Unmapped params are passed along, as-is
 * Reasonable default values are applied if nothing is input
 */
class RallyParam {
  constructor(settings) {
    this.settings = settings;
  }

  queryParams(options, asString) {
    const mappedParams = {};

    if (options?.workspace && isString(options?.workspace)) {
      mappedParams.workspace = `/workspace/${options.workspace}`;
    } else {
      mappedParams.workspace = `/workspace/${this.settings.workspace}`;
    }

    isString(options?.project) && (mappedParams.project = `/project/${options.project}`);

    if (options?.fetch) {
      if (Array.isArray(options.fetch)) {
        mappedParams.fetch = options.fetch.join(",");
      } else if (isString(options.fetch)) {
        mappedParams.fetch = options.fetch.trim();
      }
    }

    if (options?.itemfetch) {
      if (Array.isArray(options.itemfetch)) {
        mappedParams.itemfetch = options.itemfetch.join(",");
      } else if (isString(options.itemfetch)) {
        mappedParams.itemfetch = options.itemfetch.trim();
      }
    }

    if (options?.shallowFetch) {
      if (Array.isArray(options.shallowFetch)) {
        mappedParams.shallowFetch = options.shallowFetch.join(",");
      } else if (isString(options.shallowFetch)) {
        mappedParams.shallowFetch = options.shallowFetch.trim();
      }
    }

    if (options?.itemtypes) {
      if (Array.isArray(options.itemtypes)) {
        mappedParams.itemtypes = options.itemtypes.join(",");
      } else if (isString(options.itemtypes)) {
        mappedParams.itemtypes = options.itemtypes.trim();
      }
    }

    const optionKeys = Object.keys(options);
    const mappedKeys = Object.keys(mappedParams);
    const mappedDiff = optionKeys.filter((item) => !mappedKeys.includes(item));
    for (let i = 0; i < mappedDiff.length; i++) {
      mappedParams[mappedDiff[i]] = options[mappedDiff[i]];
    }

    if (isBool(asString) && asString === true) {
      return new URLSearchParams(mappedParams).toString();
    } else {
      return mappedParams;
    }
  }
}

module.exports.RallyParam = RallyParam;
