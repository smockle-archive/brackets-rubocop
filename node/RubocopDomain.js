/*jshint bitwise: true, curly: true, eqeqeq: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: double, undef: true, unused: vars, strict: true, trailing: true, maxdepth: 3, browser: true */
/*global require, process, exports */

(function () {
    "use strict";
    
    var childProcess = require("child_process"),
        spawn = childProcess.spawn,
        DOMAIN = "rubocop",
        RUBY = "ruby-2.0.0-p247";
    
    function _lint(currentPath, callback) {
        var proc,
            command = "rubocop",
            output = "",
            environment = process.env;
        
        environment.PATH =
            environment.HOME + "/.rvm/gems/" + RUBY + "/bin:" +
            environment.HOME + "/.rvm/gems/" + RUBY + "@global/bin:" +
            environment.HOME + "/.rvm/rubies/" + RUBY + "/bin:" +
            environment.HOME + "/.rvm/bin:" +
            "/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin:/opt/local/bin";
      
        proc = spawn(command, [currentPath, "--format", "json"], { env: environment });
        
        proc.stdout.on("data", function (data) {
            output += data;
        });
        
        proc.stderr.on("data", function (err) {
            output += err;
        });
        
        proc.on("close", function (code) {
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
            "Lints the current file with RuboCop.",
            [],         // no parameters
            []
        );
    }
    
    exports.init = init;
}());