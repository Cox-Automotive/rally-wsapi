const { isString } = require("./utils");
const Regex = require("./regex"); 

/**
 * Rally WSAPI for Node.js
 * RallyQuery
 * 
 * Generates queries in the expected WSAPI format, wrapping all 
 * where, and, or statements in parenthesis.
 */
class RallyQuery {
  constructor(left, op, right) {
    this.left = left;
    this.op = op;
    this.right = right;
  }

  toQueryString() {
    let left = this.left;
    let right = this.right;
    if (left.toQueryString) {
      left = left.toQueryString();
    }

    if (right === null) {
      right = "null";
    } else if (right.toQueryString) {
      right = right.toQueryString();
    } else if (Regex.isRef(right)) {
      right = Regex.getRelative(right);
    } else if (isString(right) && right.indexOf(" ") >= 0) {
      right = `"${right}"`;
    }

    return `(${left} ${this.op} ${right})`;
  }

  and(left, op, right) {
    return new RallyQuery(this, "AND", left instanceof RallyQuery ? left : new RallyQuery(left, op, right));
  }

  or(left, op, right) {
    return new RallyQuery(this, "OR", left instanceof RallyQuery ? left : new RallyQuery(left, op, right));
  }
}

function where(left, op, right) {
  return new RallyQuery(left, op, right);
}

module.exports.RallyQuery = RallyQuery;
module.exports.where = where;
