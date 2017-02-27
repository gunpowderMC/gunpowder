/**
 * backup
 * This file was created on 16/02/17 by kkprince, and is
 * a part of gunpowder. This file may be proprietary,
 * however please se the LICENSE file in the root of this
 * project for specific handling instructions
 */
const child_process = require('child_process'),
    path = require('path'),
    fs = require('fs'),
    d = require('./util/d'),
    moment = require('moment')

function backup(name, deletionPolicy) {
    const backupDir = '/work/backup',
        suffix = ((typeof name === "string" && name !== '') ? '-' + name : '') + '.tar.xz',
        fileName = path.join(backupDir, (new Date()).toJSON()) + suffix
    fs.readdir(backupDir, (err, files) => {
        if (err) {
            d('Error while reading directory "' + backupDir + '"')
            return
        }
        let deletes = []

        function escapeRegExp(str) {
            return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
        }

        files.forEach(file => {
            let fileR = file.match('^(.+)' + escapeRegExp(suffix) + '$')
            if (fileR) {
                let time = moment(fileR[1])

                if (!isNaN(time)) {
                    if (time.date() != 1) {
                        if (time.day() != 0) {
                            if (!moment().subtract(deletionPolicy.keep_daily || 7, 'days').isSameOrBefore(time)) {
                                deletes.push(file)
                            }
                        } else {
                            if (!moment().subtract(deletionPolicy.keep_weekly || 4, 'weeks').isSameOrBefore(time)) {
                                deletes.push(file)
                            }
                        }
                    } else {
                        if (!moment().subtract(deletionPolicy.keep_monthly || 6, 'months').isSameOrBefore(time)) {
                            deletes.push(file)
                        }
                    }
                }
            }
        })
        deletes.forEach(file => {
            fs.unlink(file, e => d(!e ? `Old backup ${file} has been removed` : `Error deleting old backup ${file}`))
            fs.unlink(file + '.sha256sum', () => {
            })
            fs.unlink(file + '.md5sum', () => {
            })
        })
    })

    process.send({
        dest: 'minecraft',
        msg: {
            act: 'command',
            cmd: 'save-all'
        }
    })
    process.send({
        dest: 'minecraft',
        msg: {
            act: 'command',
            cmd: 'save-off'
        }
    })
    d('Starting backup: ' + fileName)
    child_process.spawn('/bin/tar', [
        `--exclude='${path.join(PROJECT_ROOT, 'run', 'backup')}'`,
        '-chJf',
        fileName,
        path.join(PROJECT_ROOT, 'run')
    ]).on('exit', () => {
        let done = 0

        function onceDone() {
            done++
            if (done < 2) return
            d('Backup done!')
            process.send({
                dest: 'minecraft',
                msg: {
                    act: 'command',
                    cmd: 'save-on'
                }
            })
        }

        let sha = child_process.spawn('/usr/bin/openssl', ['dgst', '-sha256', fileName]),
            md5 = child_process.spawn('/usr/bin/openssl', ['dgst', '-md5sum', fileName])

        sha.stdout.pipe(fs.createWriteStream(fileName + '.sha256sum'))
        md5.stdout.pipe(fs.createWriteStream(fileName + '.md5sum'))

        sha.on('exit', onceDone)
        md5.on('exit', onceDone)
    })
}

setInterval(() => {
}, 9999999999)

process.on('message', msg => {
    switch (msg.act) {
        case 'backup':
            backup(msg.name, msg.deletionPolicy)
            break
    }
})