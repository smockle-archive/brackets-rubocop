/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, browser: true */
/*global $, define, brackets */

define(function (require, exports, module) {
    "use strict";
    
    var AppInit = brackets.getModule("utils/AppInit"),
        CodeInspection = brackets.getModule("language/CodeInspection"),
        DocumentManager = brackets.getModule("document/DocumentManager"),
        ProjectManager = brackets.getModule("project/ProjectManager"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        NodeConnection = brackets.getModule("utils/NodeConnection"),
        Async = brackets.getModule("utils/Async");
    
    var g_lints;
    var g_inprogress = false;
    var g_checked;
    
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
            g_inprogress = true;
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
        
        // Helper function that runs the rubocop.lint command
        function getResults() {
            var currentDoc = DocumentManager.getCurrentDocument(),
                currentPath = currentDoc.file.fullPath;
            var resultsPromise = nodeConnection.domains.rubocop.lint(currentPath);
            resultsPromise.fail(function (err) {
                console.error("[brackets-rubocop] failed to run rubocop.lint", err);
            });
            resultsPromise.done(function (lints) {
                console.log("[brackets-rubocop] Done");
                g_lints = lints;
                g_checked = checkResults(lints);
                g_inprogress = false;
                CodeInspection.toggleEnabled(true);
            });
            return resultsPromise;
        }
        
        function checkResults(lints) {
            console.log("[brackets-rubocop] Linting");
            lints = JSON.parse(lints);
            if (lints.summary.offence_count === 0) {
                return null;
            } else {
                var offenses = lints.files[0].offences;
                var result = { errors: [] };
                for (var i = 0, len = offenses.length; i < len; i++) {
                    var messageOb = offenses[i];
                    //encountered an issue when jshint returned a null err
                    if (!messageOb) continue;
                    //default
                    var type = CodeInspection.Type.ERROR;
            
                    if ("severity" in messageOb) {
                        if (messageOb.severity === "convention") {
                            type = CodeInspection.Type.WARNING;
                        }
                    }
            
                    result.errors.push({
                        pos: { line: messageOb.location.line - 1, ch: messageOb.location.column },
                        message: messageOb.message,
                        type: type
                    });
                }
                return result;
            }
        }
        
        function lintRuby() {
            if (g_lints === undefined && !g_inprogress) {
                Async.chain([connect, loadSimpleDomain, getResults]);
                return null;
            } else if (g_checked !== undefined && !g_inprogress) {
                window.g_checked = g_checked;
                g_lints = undefined;
                return g_checked;
            } else {
                return null;
            }
        }
      
        CodeInspection.register("ruby", {
            name: "Rubocop",
            scanFile: lintRuby
        });
    });
});