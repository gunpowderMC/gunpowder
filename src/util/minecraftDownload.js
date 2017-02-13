/**
 * minecraftDownload
 * This file was created on 12/02/17 by kkprince, and is
 * a part of gunpowder. This file may be proprietary,
 * however please se the LICENSE file in the root of this
 * project for specific handling instructions
 */

const d = require('./d'),

    http = require("http"),
    https = require("https"),
    fs = require('fs'),
    crypto = require("crypto")

function runCallback(cb, ...args) {
    if (typeof cb === "function") {
        return cb(...args)
    }
}

function chkObj(baseObj, path) {
    if (typeof baseObj === 'undefined') return false
    path = path.split('.')
    path.shift()
    if (path[0] === '') {
        return true
    } else
        return chkObj(baseObj[path.shift()], '.' + path.join('.'))
}

function getJson(uri, cb) {
    let protocol
    // If uri looks like it's https, require https module, otherwise standard http
    if (uri.match(/^https:\/\//)) {
        protocol = require("https")
    } else {
        protocol = require("http")
    }
    protocol.get(uri, function (res) {
        if (res.statusCode !== 200) {
            // consume response data to free up memory
            res.resume();
            callback(new Error(`Request Failed. Status Code: ${res.statusCode}`))
            return;
        }

        // Decode It!
        res.setEncoding('utf8')
        let rawData = ''
        res.on('data', (chunk) => rawData += chunk)
        res.on('end', () => {
            let parsedData
            try {
                parsedData = JSON.parse(rawData)
            } catch (e) {
                runCallback(cb, e)
                return
            }
            runCallback(cb, undefined, parsedData)
        })
    })
}

function download(outFile, ver, cb) {
    const version_manifest = "https://launchermeta.mojang.com/mc/game/version_manifest.json"
    if (typeof outFile === 'undefined' || outFile === '') {
        runCallback(cb, new Error("Output file invalid: " + outFile))
    }

    d(`Downloading version_manifest...`)
    getJson(version_manifest, (err, launchermetaData) => {
        if (err) {
            runCallback(err)
            return
        }
        if (chkObj(launchermetaData, '.versions')) {
            if (typeof ver === 'undefined' || ver === '') {
                ver = launchermetaData.latest.release
            }
            getJson(launchermetaData.versions[launchermetaData.versions.findIndex(version => version.id === ver)].url, (err, mcFiles) => {
                if (err) throw err
                if (chkObj(mcFiles, 'mcFiles.downloads.server.url')) {
                    d('Download and parse complete. Will download jar now.')
                    https.get(mcFiles.downloads.server.url, function (res) {
                        if (res.statusCode !== 200) {
                            // consume response data to free up memory
                            res.resume();
                            runCallback(cb, new Error(`Request for server.jar Failed. Status Code: ${res.statusCode}`))
                        }
                        let mcjar = fs.createWriteStream(outFile);
                        res.pipe(mcjar)
                        res.on('end', () => {
                            mcjar.close();
                            d('Download complete. Will Now check hash...')

                            mcjar = fs.createReadStream(outFile);
                            let hash = crypto.createHash('sha1');
                            hash.setEncoding('hex');

                            mcjar.on('end', function () {
                                hash.end();
                                if (hash.read() === mcFiles.downloads.server.sha1) {
                                    d(`Hash matches ${mcFiles.downloads.server.sha1}`)
                                    runCallback(cb)
                                } else {
                                    d(`Hash mismatch: ${mcFiles.downloads.server.sha1}`)
                                    process.exit(1)
                                }
                            });
                            mcjar.pipe(hash);
                        })
                    })
                }
            })
        }
    })
}

module.exports = download