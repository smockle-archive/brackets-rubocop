/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, node: true */
/*global */

(function () {
    "use strict";
    
    var childProcess = require("child_process"),
        spawn = childProcess.spawn;
    
    var DOMAIN = "rubocop";
    
    function _lint(currentPath, callback) {
        var proc,
            command = "rubocop",
            error = "",
            output = "",
            environment = process.env;
        
        environment.PATH = "/Users/clay/.rvm/gems/ruby-2.0.0-p247/bin:/Users/clay/.rvm/gems/ruby-2.0.0-p247@global/bin:/Users/clay/.rvm/rubies/ruby-2.0.0-p247/bin:/Users/clay/.rvm/bin:/Applications/Postgres.app/Contents/MacOS/bin:/usr/local/heroku/bin:/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin:/opt/local/bin";
      
        proc = spawn(command, [currentPath, "--format", "json"], { env: environment });
        
        proc.stdout.on("data", function (data) {
            output += data;
        });
        
        proc.stderr.on("data", function (err) {
            output += err;
        });
        
        proc.on("close", function (code) {
            console.log("[brackets-rubocop] Closing");
            proc.kill();
            callback(undefined, output);
            return;
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
            _lint,       // command handler function
            true,       // this command is synchronous
            "Lints the current file with Rubocop.",
            [],         // no parameters
            []
        );
    }
    
    exports.init = init;
    
}());