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

const child_process = require('child_process')

let threads = {
    webui: '/src/webui',
    minecraft: '/src/minecraft'
    // test: './test.js'
}

for (let thread in threads) {
    threads[thread] = child_process.fork(PROJECT_ROOT + threads[thread], [], {
        cwd: process.cwd(),
        env: Object.assign({
            GP_PROJECT_ROOT: PROJECT_ROOT,
            GP_THREAD_NAME: thread
        }, process.env),
        silent: false
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
        if (
            typeof msg !== "object" || Array.isArray(msg) || typeof msg.dest !== "string"
            || typeof msg.msg !== "object"
        ) {
            d('Error: Invalid IPC message received: ', msg)
        } else if (typeof threads[msg.dest] === "undefined") {
            d('Error: Invalid IPC Destination received: ' + msg.dest)
        } else {
            threads[msg.dest].send(msg.msg, sendHandle)
        }
    })
}

function killer(proc, cb, tryn = 0, dead = false) {
    if (typeof proc.exit !== 'undefined') {
        if(typeof cb === 'function') cb()
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

    proc.killer.id = setTimeout(proc.killer.func, 500)
}

function killAll(obj, cb) {
    let n=Object.keys(obj).length
    for (let proc in obj)
        if (obj.hasOwnProperty(proc)) {
            proc = threads[proc]
            killer(proc, ()=>{
                if(--n === 0){
                    d('Killing done')
                    if(typeof cb === 'function') cb()
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

setInterval(() => {
    threads.webui.emit('message', {
        dest: 'webui',
        msg: {
            act: 'console',
            text: 'Testing: ' + (new Date())
        }
    })
}, 5000)