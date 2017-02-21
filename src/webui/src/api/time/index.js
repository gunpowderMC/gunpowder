/**
 * index
 * This file was created on 20/02/17 by kkprince, and is
 * a part of gunpowder. This file may be proprietary,
 * however please se the LICENSE file in the root of this
 * project for specific handling instructions
 */
const db = require('../../../../db'),
    moment = require('moment')

function unixToJSON(unix) {
    return moment(unix, 'X').toJSON()
}
function timeFormatter(r) {
    let payload = []
    r.forEach(rr => {
        payload.push({
            start: unixToJSON(rr.start),
            end: unixToJSON(rr.end),
            group: rr.uuid,
            content: `<a href="/player/${rr.uuid}">${rr.username}</a>`,
            title: `<a href="/player/${rr.uuid}">${rr.username}</a>`
        })
    })
    return payload
}
module.exports = router => {
    router.get('/time', (req, res) => {
        const cutOff = moment().days(-3).unix()
        db.times.find({
            $or: [
                {end: {$gt: cutOff}},
                {start: {$gt: cutOff}}
            ]
        }).then(r => res.json(timeFormatter(r)))
    })
    router.get('/time/:uuid', (req, res) => {
        const cutOff = moment().days(-3).unix()
        db.times.find({
            uuid: req.params.uuid,
            $or: [
                {end: {$gt: cutOff}},
                {start: {$gt: cutOff}}
            ]
        }).then(r => res.json(timeFormatter(r)))
    })
}