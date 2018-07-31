'use strict';
module.exports = function(grunt) {
    var basePath = process.cwd();
    var semver = require('semver');
    var fs = require('fs');
    var extend = require('util')._extend;
    var semverRegex = require('semver-regex');

    function readJSONFile(path) {
        return JSON.parse(fs.readFileSync(path));
    }

    function notValidVersion(version) {
        return /git/.test(version) || !semverRegex().test(version);
    }

    function checkPackages(packages) {
        var hasErrors = false;
        for (var dep in packages) {
            // skip is own kindness
            if (dep === 'grunt-package-check') continue;

            var npmVersion = packages[dep];
            var installedPackageJson = readJSONFile(basePath + '/node_modules/' + dep + '/package.json').version;

            // check for inlined version
            if (npmVersion.indexOf('#') > 0) {
                npmVersion = npmVersion.substring(npmVersion.indexOf('#') + 1, npmVersion.length);
            }


            if (notValidVersion(npmVersion)) {
                grunt.log.writeln('Info: Could not check version on ' + dep.bold + ' ' +  npmVersion.underline);
            } else  if (!semver.satisfies(installedPackageJson, npmVersion)) {
                grunt.log.writeln('Warning: '.yellow + dep.bold + ' has version mismatch!'.red);
                grunt.log.writeln('\tinstalled: ' + installedPackageJson);
                grunt.log.writeln('\tconfigured: ' + npmVersion);
                hasErrors = true;
            }
        }
        return hasErrors;
    }

    grunt.registerTask('package-check', 'Check npm package version requirements against installed ones', function() {
        var packageJson = readJSONFile(basePath  + '/package.json');
        var packages = extend({}, packageJson.devDependencies);
        packages = extend(packages, packageJson.dependencies);
        var hasErrors = checkPackages(packages);
        if (hasErrors) {
            grunt.log.writeln('Quitting Grunt for NPM package version conflicts. '.bold.red);
            grunt.log.writeln('* Consider running `npm install/npm update`'.bold);
            process.exit(3);
        } else {
            grunt.log.writeln('\nNo outdated npm packages found, continuing...'.green);
        }
    });
};