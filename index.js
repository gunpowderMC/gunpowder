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
function d(...tt) {
    function date() {
        let d = new Date()
        return `[${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}:${d.getMilliseconds()}]`
    }
    tt.forEach(t => {
        console.log(date() + ' ' +
            (typeof t === 'object'
                ? JSON.stringify(t, null, 2)
                : t)
        )
    })
}

const child_process = require('child_process')

let procs = {
    webui: './src/webui'
}

for (let proc in procs) {
    procs[proc] = child_process.fork(procs[proc], [], {
        cwd: process.cwd(),
        env: Object.assign({PROJECT_ROOT: PROJECT_ROOT}, process.env),
        silent: false
    })
    procs[proc].name = proc
    procs[proc].on('exit', (code) => {
        procs[proc].exit = code
        clearTimeout(procs[proc].killing)
        if (typeof procs[proc].killer.func === "function") {
            procs[proc].killer.func()
        }
        d(`${proc.name} is dead.`)
    })
}

function killer(proc, cb, tryn = 0, dead = false) {
    if (typeof proc.exit !== 'undefined') {
        if(typeof cb === 'function') cb()
        return
    }
    if (tryn >= 10) {
        d(`trying to SIGKILL ${proc.name}...`)
        proc.kill('SIGKILL')
    } else {
        d(`trying to kill ${proc.name}...`)
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
            proc = procs[proc]
            killer(proc, ()=>{
                if(--n === 0){
                    d('Killing done')
                    if(typeof cb === 'function') cb()
                } else d(`Killing has ${n} left`)
            })
        }
}

['exit', 'SIGINT', 'SIGHUP', 'SIGTERM', 'uncaughtException'].forEach(signal=>process.on(signal, ()=>{
    d(`Caught ${signal}`)
    killAll(procs, process.exit)
    process.removeAllListeners()
}))