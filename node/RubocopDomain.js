/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, node: true */
/*global */

(function () {
    "use strict";
    
    var os = require("os");
    
    var DOMAIN = "rubocop";
    
    /**
     * @private
     * Handler function for the simple.getMemory command.
     * @return {{total: number, free: number}} The total and free amount of
     *   memory on the user's system, in bytes.
     */
    function lint() {
        return {total: os.totalmem(), free: os.freemem()};
    }
    
    /**
     * Initializes the test domain with several test commands.
     * @param {DomainManager} DomainManager The DomainManager for the server
     */
    function init(DomainManager) {
        if (!DomainManager.hasDomain(DOMAIN)) {
            DomainManager.registerDomain(DOMAIN, {major: 0, minor: 1});
        }
        DomainManager.registerCommand(
            DOMAIN,     // domain name
            "lint",     // command name
            lint,       // command handler function
            false,      // this command is synchronous
            "Lints the current file with Rubocop.",
            [],         // no parameters
            []
        );
    }
    
    exports.init = init;
    
}());