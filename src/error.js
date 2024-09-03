/**
 * Rally WSAPI for Node.js
 * RallyError
 * 
 * Custom error messages for critical issues
 * Maps the status code, event context, and custom message
 */
class RallyError extends Error {
    constructor(status, context, message) {
        message = `[RallyClient][${context}] ${message}`;
        super(message);
        this.status = status;
        this.context = context;
    }

    statusCode() {
        return this.status;
    }

    context() {
        return this.context;
    }
}

const errors = {
    BASIC_AUTH_ERR: "Rally auth failed using basic user:pass",
    QUERY_ERR: "Rally WAPI encountered an error"
};

module.exports.RallyError = RallyError;
module.exports.ErrMsg = errors;
