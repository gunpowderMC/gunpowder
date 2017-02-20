/**
 * index.js
 * This file was created on 10/02/17 by kkprince, and is
 * a part of gunpowder. This file may be proprietary,
 * however please se the LICENSE file in the root of this
 * project for specific handling instructions
 */

/**
 * This file handles the creation of the child threads for:
 * - Webui
 */

const PROJECT_ROOT = __dirname
global.THREAD_NAME = process.env.GP_THREAD_NAME || 'main'


const d = require('./src/util/d')

const child_process = require('child_process'),
    fs = require('fs')

let threads = {
    webui: '/src/webui',
    minecraft: '/src/minecraft',
    cron: '/src/cron',
    dataRecorder: '/src/dataRecorder'
}
// let port = process.execArgv[0].split('=')[1]
for (let thread in threads) {
    try {
        fs.mkdirSync(thread)
    } catch (e) {
    }
    threads[thread] = child_process.fork(PROJECT_ROOT + threads[thread], [], {
        cwd: thread,
        env: Object.assign({
            GP_PROJECT_ROOT: PROJECT_ROOT,
            GP_THREAD_NAME: thread
        }, process.env),
        stdio: [0, 1, 2, 'ipc'],
        execArgv: [
            // '--debug-brk=' + ++port
        ]
    })
    threads[thread].name = thread
    threads[thread].killer = {}
    threads[thread].on('exit', (code) => {
        threads[thread].exit = code
        clearTimeout(threads[thread].killing)
        if (typeof threads[thread].killer.func === "function") {
            threads[thread].killer.func()
        }
        d(`Thread '${threads[thread].name}' is dead.`)
    })

    threads[thread].on('message', (msg, sendHandle) => {
        try {
            if (
                typeof msg !== "object" || Array.isArray(msg) || typeof msg.dest !== "string"
                || typeof msg.msg !== "object"
            ) {
                d('Error: Invalid IPC message received: ', msg)
            } else if (msg.dest === '*') {
                Object.keys(threads).forEach(t => {
                    if (t !== thread) threads[t].send(msg.msg, sendHandle)
                })
            } else if (typeof threads[msg.dest] === "undefined") {
                d('Error: Invalid IPC Destination received: ' + msg.dest)
            } else {
                threads[msg.dest].send(msg.msg, sendHandle)
            }
        } catch (e) {
            d('SEVERE error occured sending IPC massage "' + e.message + '" (this can be safely ignored during shutdown)')
        }
    })
}

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

function killAll(obj, cb) {
    let n = Object.keys(obj).length
    for (let proc in obj)
        if (obj.hasOwnProperty(proc)) {
            proc = threads[proc]
            killer(proc, () => {
                if (--n === 0) {
                    d('Killing done')
                    if (typeof cb === 'function') cb()
                } else d(`Killing has ${n} left`)
            })
        }
}

['exit', 'SIGINT', 'SIGHUP', 'SIGTERM'
    //, 'uncaughtException'
].forEach(signal => process.on(signal, () => {
    d(`Caught ${signal}`)
    killAll(threads, process.exit)
    process.removeAllListeners()
}))
