/**
 * Rally WSAPI for Node.js
 * RallyLog
 * 
 * Basic debug and error logging
 */
class RallyLog {
  constructor() {
    const debugMode = process.env.DEBUG?.toLowerCase() === 'true' || false;
    this.debug = debugMode === true || false;
  }

  log(message) {
    if (this.debug) {
      console.log(`[Rally][DEBUG] ${message}`);
    }
  }

  error(message) {
    console.error(`[Rally][ERROR] ${message}`);
  }
}

module.exports.RallyLog = RallyLog;
