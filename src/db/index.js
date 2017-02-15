/**
 * index
 * This file was created on 13/02/17 by kkprince, and is
 * a part of gunpowder. This file may be proprietary,
 * however please se the LICENSE file in the root of this
 * project for specific handling instructions
 */

const d = require('../util/d'),

    db = require('monk')('mongod/gunpowder'),
    users = db.get('webui.users'),
    players = db.get('players')

module.exports = {
    db: db,
    users: users,
    players: players,

    user: {
        validate: function (user, pass, callback) {
            return users.find({
                username: user,
                password: pass
            }).then(res => (!!res[0] && !res[0].disabled) ? res[0] : false).then(t => {
                if (t) t._id = t._id.toString()
                return t
            }).then(callback)
        },
        getFromId: function (id, callback) {
            return users.find(id).then(res => !!res[0] ? res[0] : false).then(callback)
        },
        createAdmin: function (password = require('randomstring').generate(12)) {
            users.find({username: 'admin'}).then(res => !!res[0] ? res[0]._id : false)
                .then(user => {
                    if (!user) {
                        d(`Creating a admin user with password: ${password}`)
                        users.insert({
                            username: 'admin',
                            password: password,
                            capabilities: [
                                'all'
                            ],
                            notifications: []
                        })
                    }
                })
        }
    }
}

