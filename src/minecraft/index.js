/**
 * index
 * This file was created on 11/02/17 by kkprince, and is
 * a part of gunpowder. This file may be proprietary,
 * however please se the LICENSE file in the root of this
 * project for specific handling instructions
 */


global.THREAD_NAME = process.env.GP_THREAD_NAME || 'minecraft'
const d = require('../util/d'),
    mcDownload = require('../util/minecraftDownload'),
    fs = require('fs'),
    child_process = require('child_process'),
    path = require('path')

const jar = typeof process.env.MINECRAFT_JAR !== "undefined"
    ? process.env.MINECRAFT_JAR
    : 'minecraft.jar'

let stop = false

if (!fs.existsSync(jar)) {
    mcDownload(jar, undefined, next)
} else {
    next()
}

function checkKind(msg) {
    let result
    if (result = msg.match(/\[[0-9:]{8}\] \[.+?\]: ([a-zA-Z0-9_]{3,16})\[\/((?:[0-9]{1,3}\.){3}[0-9]{1,3}):[0-9]+?\] logged in with entity id [0-9]+? at \(((?:[0-9]+?\.[0-9]+?, ){2}[0-9]+?\.[0-9]+?)/)) {
        return {
            act: 'login',
            user: result[1],
            ip: result[2],
            loginLocation: result[3]
        }
    } else {
        return {
            kind: 'other'
        }
    }
}

function next(e) {
    let mc
    if (e) throw e
    function start() {
        mc = child_process.spawn(
            path.join(process.env.JAVA_HOME, "bin", "java"),
            [
                // `-Dlog4j.configurationFile=${path.join(__dirname, 'logger.xml')}`,


                "-jar", `${jar}`,
                "nogui"
            ]
        )


        mc.stdout.on('data', buffOut())
        mc.stderr.on('data', buffOut())

        mc.name = 'minecraft-server'
        mc.killer = {}
        mc.on('exit', code => {
            mc.exit = code
            if (!stop) setTimeout(start, 50)
        })

        function buffOut() {
            function sendConsole(msg) {
                process.send({
                    dest: '*',
                    msg: {
                        act: 'console',
                        text: msg
                    }
                })
            }
            let buf = ''
            return function (data) {
                buf += data
                const lines = buf.split('\n')
                for (let i = 0; i < lines.length - 1; i++) {
                    let res = checkKind(lines[i])
                    switch (res.act) {
                        case 'login':
                            sendConsole(lines[i])
                            process.send({
                                dest: '*',
                                msg: res
                            })
                            break
                        default:
                            sendConsole(lines[i])
                    }
                }
                buf = lines[lines.length - 1]
            }
        }

        d('Minecraft Started')
        return mc
    }

    start()

    function killer(proc, cb, tryn = 0) {
        if (typeof proc.exit !== 'undefined') {
            d(`Killed '${proc.name}'`)
            if (typeof cb === 'function') cb()
            return
        }
        if (tryn >= 10) {
            d(`trying to SIGKILL '${proc.name}'...`)
            proc.kill('SIGKILL')
        } else {
            d(`trying to kill '${proc.name}'...`)
            proc.kill()
        }
        proc.killer = {
            func: killer.bind(this, proc, cb, ++tryn)
        }

        proc.killer.id = setTimeout(proc.killer.func, 1000)
    }

    ['exit', 'SIGINT', 'SIGHUP', 'SIGTERM'
        //, 'uncaughtException'
    ].forEach(signal => process.on(signal, () => {
        mc.removeAllListeners('exit')
        killer(mc, process.exit)
        process.removeAllListeners()
    }))

    process.on('message', (msg, sendHandle) => {
        switch (msg.act) {
            case 'command':
                try {
                    mc.stdin.write(msg.cmd + "\n")
                } catch (e) {
                    d('Error sending command to server')
                }
                break
            case 'stop':
                d('Stopping server')
                stop = true
                killer(mc)
                break
            case 'start':
                if (typeof proc.exit === 'undefined') {
                    d('Starting server')
                    stop = false
                    start()
                } else {
                    d('Server already running!')
                }
                break
            case 'restart':
                d('Restarting server')
                stop = true
                killer(mc)
                stop = false
                start()
                break
        }
    })
}

