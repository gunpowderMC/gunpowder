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

if (!fs.existsSync(jar)) {
    mcDownload(jar, undefined, next)
} else {
    next()
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
        mc.on('exit', () => {
            setTimeout(start, 1000)
        })

        function buffOut() {
            let buf = ''
            return function (data) {
                buf += data
                const lines = buf.split('\n')
                for (let i = 0; i < lines.length - 1; i++) {
                    process.send({
                        dest: '*',
                        msg: {
                            act: 'console',
                            text: lines[i]
                        }
                    })
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
                mc.stdin.write(msg.cmd + "\n")
                break
        }
    })
}
