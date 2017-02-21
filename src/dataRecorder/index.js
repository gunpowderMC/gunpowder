/**
 * index.js
 * This file was created on 20/02/17 by kkprince, and is
 * a part of gunpowder. This file may be proprietary,
 * however please se the LICENSE file in the root of this
 * project for specific handling instructions
 */

global.THREAD_NAME = process.env.GP_THREAD_NAME || 'dataRecorder'
const d = require('../util/d'),
    db = require('../db'),
    moment = require('moment')

let players = []
function endPlayer(index) {
    let player = players.splice(index, 1)[0]
    player.end = moment().unix()

    db.times.findOne({
        uuid: player.uuid,
        end: {
            $gt: moment(player.start, 'X').minutes(-5).unix()
        }
    }).then(time => {
        if (time) {
            db.times.update(time._id, {$set: {end: moment().unix()}})
        } else {
            db.times.insert({
                uuid: player.uuid,
                username: player.username,
                start: player.start,
                end: player.end
            })
        }
    })
}
process.on('message', (msg, sendHandle) => {
    switch (msg.act) {
        case 'login':
            players.push({
                uuid: msg.uuid,
                username: msg.username,
                start: moment().unix()
            })
            break
        case 'logout':
            players.forEach((player, index) => {
                if (player.uuid === msg.uuid) {
                    endPlayer(index)
                }
            })
            break
        case 'stop':
            players.forEach((p, index) => {
                endPlayer(index)
            })
            players = []
            break
    }
})