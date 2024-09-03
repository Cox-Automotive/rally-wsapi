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

module.exports.isObject = isObject;
module.exports.isString = isString;
module.exports.isBool = isBool;
module.exports.isNumber = isNumber;
