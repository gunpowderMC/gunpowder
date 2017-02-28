/**
 * index
 * This file was created on 22/02/17 by kkprince, and is
 * a part of gunpowder. This file may be proprietary,
 * however please se the LICENSE file in the root of this
 * project for specific handling instructions
 */

global.PROJECT_ROOT = process.env.GP_PROJECT_ROOT || __dirname + '/../..'
global.THREAD_NAME = process.env.GP_THREAD_NAME || 'Module Loader'

const d = require('../util/d'),
    child_process = require('child_process'),
    fs = require('fs')

let modules = {}
function mkdirp(...names) {
    names.forEach(name => {
        try {
            fs.mkdirSync(name)
        } catch (e) {
        }
    })
}
mkdirp('./modules', './workdirs')
fs.readdir('./modules', {}, (err, modules) => {
    if (err) {
        d(err.message, err.stack)
        return
    }
    modules.forEach(module => {
        try {
            modules[module] = load(process.cwd() + '/modules/' + module, module.replace(/\.js$/, ''))
        } catch (e) {
            d(`Error loading ${module}, ${e.message}`)
        }
    })
})

function load(location, name) {
    mkdirp('./workdirs/' + name)
    let cp = child_process.fork(location, [], {
        cwd: './workdirs/' + name,
        env: Object.assign({
            GP_PROJECT_ROOT: PROJECT_ROOT,
            DB_URL: 'mongod/gunpowder'
        }, process.env),
        stdio: [0, 1, 2, 'ipc'],
        execArgv: [
            // '--debug-brk=' + ++port
        ]
    })
    cp.name = name
    cp.killer = {}
    cp.on('exit', (code) => {
        cp.exit = code
        clearTimeout(cp.killing)
        if (typeof cp.killer.func === "function") {
            cp.killer.func()
        }
        d(`Thread '${cp.name}' is dead.`)
        delete modules[name]
    })
    cp.on('message', msg => {
        try {
            if (
                typeof msg !== "object" || Array.isArray(msg) || typeof msg.dest !== "object"
                || typeof msg.msg !== "object"
            ) {
                d('Error: Invalid IPC message received: ', msg)
                return
            }
            switch (msg.dest.type) {
                case 'all':
                    module(msg.dest.dest, msg.msg)
                    gunpowder(msg.dest.dest, msg.msg)
                    break
                case 'module':
                    module(msg.dest.dest, msg.msg)
                    break
                case 'gunpowder':
                    gunpowder(msg.dest.dest, msg.msg)
                    break
                default:
                    d('Error: Invalid IPC Destination received: ' + msg.dest)
            }

            function module(dest, msg) {
                if (dest === '*') {
                    Object.keys(modules).forEach(m => {
                        if (m !== name) modules[m].send(msg.msg)
                    })
                } else if (typeof modules[dest] === "undefined") {
                    d('Error: Invalid IPC Destination received: ' + dest)
                } else {
                    modules[dest].send(msg)
                }
            }
            function gunpowder(dest, msg) {
                process.send({
                    dest: dest,
                    msg: msg
                })
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
    killAll(modules, process.exit)
    process.removeAllListeners()
}))
