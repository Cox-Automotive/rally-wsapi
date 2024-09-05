/**
 * Rally WSAPI for Node.js
 * Type Utils
 * 
 * Convenience methods replacing the original Lodash code
 * @param {*} value 
 * @returns boolean
 */

const isObject = function (value) {
  return value !== null && typeof value === "object";
};

const isString = function (value) {
  return value !== null && typeof value === "string";
};

const isBool = function (value) {
  return value !== null && typeof value === "boolean";
};

const isNumber = function (value) {
  return value !== null && typeof value === "number";
};

const maskValue = function(secret, visibleChars = 4) {
  if (isNumber(secret)) {
    secret = secret.toString();
  }

  if (!isString(secret)) {
    return secret;
  }

  if (secret.length < visibleChars) {
    secret = secret + ' '.repeat(secret.length + visibleChars);
  }

  const visible = secret.slice(0, visibleChars);
  const hidden = '*'.repeat(secret.length - visibleChars);
  return visible + hidden;
}

module.exports.isObject = isObject;
module.exports.isString = isString;
module.exports.isBool = isBool;
module.exports.isNumber = isNumber;
module.exports.maskValue = maskValue;
