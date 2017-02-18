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
    path = require('path'),
    db = require('../db')

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
    if (result = msg.match(/^\[(?:(?:\d{2}):){2}\d{2}] \[Server thread\/INFO]: (\w{3,16})\[\/((?:[0-9]{1,3}\.){3}[0-9]{1,3}):[0-9]+?] logged in with entity id [0-9]+? at \(((?:[0-9]+?\.[0-9]+?, ){2}[0-9]+?\.[0-9]+?)\)$/)) {
        return {
            act: 'login',
            user: result[1],
            ip: result[2],
            loginLocation: result[3]
        }
    } else if (result = msg.match(/^\[(?:(?:\d{2}):){2}\d{2}] \[Server thread\/INFO]: (\w{3,16}) left the game$/)) {
        return {
            act: 'logout',
            user: result[1]
        }
    } else if (result = msg.match(/^\[(?:(?:\d{2}):){2}\d{2}] \[User Authenticator #\d+\/INFO]: UUID of player (\w{3,16}) is ([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/)) {
        return {
            act: 'auth',
            user: result[1],
            uuid: result[2]
        }
    } else {
        return {
            kind: 'other'
        }
    }
}

function send(msg) {
    process.send({
        dest: '*',
        msg: msg
    })
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
            send({
                act: 'stop'
            })
            if (!stop) setTimeout(start, 50)
        })

        function buffOut() {
            function sendConsole(msg) {
                send({
                    act: 'console',
                    text: msg
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
                            send(res)
                            break
                        case 'auth':
                            sendConsole(lines[i])
                            send(res)
                            break
                        default:
                            sendConsole(lines[i])
                    }
                }
                buf = lines[lines.length - 1]
            }
        }

        d('Minecraft Started')
        send({
            act: 'start'
        })
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

