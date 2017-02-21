/**
 * index
 * This file was created on 19/02/17 by kkprince, and is
 * a part of gunpowder. This file may be proprietary,
 * however please se the LICENSE file in the root of this
 * project for specific handling instructions
 */
const EventEmitter = require('events').EventEmitter,
    d = require('../../../util/d')
module.exports = class extends EventEmitter {
    constructor() {
        super()
        this.players = []
        process.on('message', (msg, sendHandle) => {
            switch (msg.act) {
                case 'login':
                    this.players.push({
                        username: msg.username,
                        uuid: msg.uuid
                    })
                    break
                case 'logout':
                    this.players.forEach((player, index) => {
                        if (player.username === msg.username) this.players.splice(index, 1)
                    })
                    break
                case 'start':
                case 'stop':
                    this.players = []
                    break
            }
        })
    }
}