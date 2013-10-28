/*jshint bitwise: true, curly: true, eqeqeq: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: double, undef: true, unused: vars, strict: true, trailing: true, maxdepth: 4, browser: true */
/*global define, brackets, console */

define(function (require, exports, module) {
    "use strict";
    
    var AppInit = brackets.getModule("utils/AppInit"),
        CodeInspection = brackets.getModule("language/CodeInspection"),
        DocumentManager = brackets.getModule("document/DocumentManager"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        NodeConnection = brackets.getModule("utils/NodeConnection"),
        Async = brackets.getModule("utils/Async");
    
    var rubocop_state = "sleeping";
    var rubocop_results;
    
    AppInit.appReady(function () {
        var nodeConnection = new NodeConnection();
        
        function connect() {
            rubocop_state = "working";
            var connectionPromise = nodeConnection.connect(true);
            
            connectionPromise.fail(function () {
                console.error("[brackets-rubocop] failed to connect to node");
            });
            
            return connectionPromise;
        }
        
        function loadSimpleDomain() {
            var path = ExtensionUtils.getModulePath(module, "node/RubocopDomain"),
                loadPromise = nodeConnection.loadDomains([path], true);
            
            loadPromise.fail(function () {
                console.error("[brackets-rubocop] failed to load domain");
            });
            
            return loadPromise;
        }
        
        function getResults() {
            var currentDoc = DocumentManager.getCurrentDocument(),
                currentPath = currentDoc.file.fullPath,
                resultsPromise = nodeConnection.domains.rubocop.lint(currentPath);
            
            resultsPromise.fail(function (err) {
                console.error("[brackets-rubocop] failed to run rubocop.lint", err);
            });
            
            resultsPromise.done(function (lints) {
                rubocop_results = checkResults(lints);
                rubocop_state = "finished";
                CodeInspection.toggleEnabled(true);
            });
            
            return resultsPromise;
        }
        
        function checkResults(lints) {
            lints = JSON.parse(lints);
            
            if (lints.summary.offence_count === 0) {
                return null;
                
            } else {
                var offenses = lints.files[0].offences;
                var result = { errors: [] };
                
                for (var i = 0, len = offenses.length; i < len; i++) {
                    var offense = offenses[i];
                    
                    if (!offense) {
                        continue;
                    }
                    
                    var type = CodeInspection.Type.ERROR;
            
                    if ("severity" in offense) {
                        if (offense.severity === "convention") {
                            type = CodeInspection.Type.WARNING;
                        }
                    }
            
                    result.errors.push({
                        pos: {
                            line: offense.location.line - 1,
                            ch: offense.location.column
                        },
                        message: offense.message,
                        type: type
                    });
                }
                return result;
            }
        }
        
        function lintRuby() {
            if (rubocop_state === "sleeping") {
                Async.chain([connect, loadSimpleDomain, getResults]);
                return null;
                
            } else if (rubocop_state === "finished") {
                rubocop_state = "sleeping";
                return rubocop_results;
                
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