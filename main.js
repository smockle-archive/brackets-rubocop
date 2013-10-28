/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, browser: true */
/*global $, define, brackets */

define(function (require, exports, module) {
    "use strict";
    
    var AppInit = brackets.getModule("utils/AppInit"),
        CodeInspection = brackets.getModule("language/CodeInspection"),
        ProjectManager = brackets.getModule("project/ProjectManager"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        NodeConnection = brackets.getModule("utils/NodeConnection");
    
    // Helper function that chains a series of promise-returning
    // functions together via their done callbacks.
    function chain() {
        var functions = Array.prototype.slice.call(arguments, 0);
        if (functions.length > 0) {
            var firstFunction = functions.shift();
            var firstPromise = firstFunction.call();
            firstPromise.done(function () {
                chain.apply(null, functions);
            });
        }
    }
    
    AppInit.appReady(function () {
        // Create a new node connection. Requires the following extension:
        // https://github.com/joelrbrandt/brackets-node-client
        var nodeConnection = new NodeConnection();

        // Every step of communicating with node is asynchronous, and is
        // handled through jQuery promises. To make things simple, we
        // construct a series of helper functions and then chain their
        // done handlers together. Each helper function registers a fail
        // handler with its promise to report any errors along the way.
        
        // Helper function to connect to node
        function connect() {
            var connectionPromise = nodeConnection.connect(true);
            connectionPromise.fail(function () {
                console.error("[brackets-rubocop] failed to connect to node");
            });
            return connectionPromise;
        }
        
        // Helper function that loads our domain into the node server
        function loadSimpleDomain() {
            var path = ExtensionUtils.getModulePath(module, "node/RubocopDomain");
            var loadPromise = nodeConnection.loadDomains([path], true);
            loadPromise.fail(function () {
                console.log("[brackets-rubocop] failed to load domain");
            });
            return loadPromise;
        }
        
        // Helper function that runs the rubocop.lint command and
        // logs the result to the console
        function logResults() {
            var resultsPromise = nodeConnection.domains.rubocop.lint();
            resultsPromise.fail(function (err) {
                console.error("[brackets-rubocop] failed to run rubocop.lint", err);
            });
            resultsPromise.done(function (results) {
                console.log("[brackets-rubocop] Success: " + results);
            });
            return resultsPromise;
        }
        
        function lint() {
            chain(connect, loadSimpleDomain, logResults);
        }
      
        CodeInspection.register("ruby", {
            name: "Rubocop",
            scanFile: lint
        });
    });
});