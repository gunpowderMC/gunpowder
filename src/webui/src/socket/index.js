/**
 * index.js
 * This file was created on 14/02/17 by kkprince, and is
 * a part of gunpowder. This file may be proprietary,
 * however please se the LICENSE file in the root of this
 * project for specific handling instructions
 */

const d = require('../../../util/d')

module.exports = function (server) {
    const io = require('socket.io')(server),
        jwt = require('jsonwebtoken'),
        socketioJwt = require('socketio-jwt')

    io.set('authorization', socketioJwt.authorize({
        secret: secret,
        handshake: true
    }))

    let history = []
    process.on('message', (msg, sendHandle) => {
        switch (msg.act) {
            case 'console':
                io.emit('console', msg.text)
                history.push(msg.text)
                if (history.length >= 100) history.shift()
        }
    })

    io.on('connection', function (socket) {
        socket.on('command', cmd => {
            process.send({
                dest: 'minecraft',
                msg: {
                    act: 'command',
                    cmd: cmd
                }
            })
        })
        history.forEach(t => socket.emit('console', t))
    })

    return io
}