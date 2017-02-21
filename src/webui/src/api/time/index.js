/**
 * index
 * This file was created on 20/02/17 by kkprince, and is
 * a part of gunpowder. This file may be proprietary,
 * however please se the LICENSE file in the root of this
 * project for specific handling instructions
 */
const db = require('../../../../db'),
    moment = require('moment'),
    d = require('../../../../util/d')

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

function find(uuid, start, end) {
    let query = {},
        sub = {}
    if (uuid) query.uuid = uuid
    if (start) sub.$gte = start
    if (end) sub.$lte = end

    if (Object.keys(sub).length > 1) {
        query.$or = [
            {start: sub},
            {end: sub}
        ]
    }

    return db.times.find(query).then(r => timeFormatter(r))
}
module.exports = router => {
    router.get('/time', (req, res) => {
        const cutOff = moment().days(-3).unix()
        find(false, cutOff).then(r => res.json(r))
    })
    router.get('/time/:start/:end', (req, res) => {
        find(false, req.params.start - 0, req.params.end - 0).then(r => res.json(r))
    })
    router.get('/time/:uuid', (req, res) => {
        const cutOff = moment().days(-3).unix()
        find(req.params.uuid, cutOff).then(r => res.json(r))
    })
    router.get('/time/:uuid/:start/:end', (req, res) => {
        find(req.params.uuid, req.params.start - 0, req.params.end - 0).then(r => res.json(r))
    })
}