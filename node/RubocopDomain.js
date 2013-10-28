/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, node: true */
/*global */

(function () {
    "use strict";
    
    var childProcess = require("child_process"),
        spawn = childProcess.spawn;
    
    var DOMAIN = "rubocop";
    
    /**
     * @private
     * Handler function for the rubocop.lint command.
     * @return
     */
    function lint(currentPath) {
        var proc,
            command = "rubocop",
            error = "",
            output = "";
      
        proc = spawn(command, [currentPath]);
        
        proc.stdout.on("data", function (data) {
            output += data;
        });
        
        // append errors to output instead, so that we get all of the content back in
        // the output field in the UI.  We don't really need to distinguish.
        proc.stderr.on("data", function (err) {
            output += err;
        });
        
        proc.on("close", function (code) {
            console.log("[brackets-rubocop] Debug: " + output);
            output += "\n" + command + " completed with exit code " + code;
            return output;
        });
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