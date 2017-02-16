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
    d = require('./util/d')

module.exports = function (name) {
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
    let fileName = path.join(PROJECT_ROOT, 'run', 'backup', (new Date()).toJSON() +
            ((typeof name === "string" && name !== '') ? '-' + name : '')) + '.tar.xz'
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