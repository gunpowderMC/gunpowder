/**
 * index.js
 * This file was created on 15/02/17 by kkprince, and is
 * a part of gunpowder. This file may be proprietary,
 * however please se the LICENSE file in the root of this
 * project for specific handling instructions
 */

global.THREAD_NAME = process.env.GP_THREAD_NAME || 'main'
global.PROJECT_ROOT = process.env.GP_PROJECT_ROOT || path.join(__dirname, '..', '..')

const db = require('../db'),
    d = require('../util/d'),
    CronJob = require('cron').CronJob,
    backup = require('../backup')

let jobs = []

function reload() {
    while (jobs.length > 0) jobs.shift().stop()

    db.cron.find({}).then(dbJobs => {
        dbJobs.forEach(dbJob => {
            if (!dbJob.disabled) try {
                let func
                switch (dbJob.type) {
                    case 'command':
                        func = function () {
                            process.send({
                                dest: 'minecraft',
                                msg: {
                                    act: 'command',
                                    cmd: dbJob.command
                                }
                            })
                        }
                        break
                    case 'backup':
                        func = () => backup(dbJob.backupName)
                        break
                    default:
                        throw new Error('Invalid type: ' + dbJob.type)
                }

                let job = new CronJob(dbJob.time, func, true, 'America/Toronto')
                jobs.push(job)
            } catch (e) {
                d('Error:', e)
            }
        })
        d('Cron reloaded')
    })
}
reload()

process.on('message', (msg, sendHandle) => {
    switch (msg.act) {
        case 'reload':
            reload()
    }
})