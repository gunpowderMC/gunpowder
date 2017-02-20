/**
 * index
 * This file was created on 13/02/17 by kkprince, and is
 * a part of gunpowder. This file may be proprietary,
 * however please se the LICENSE file in the root of this
 * project for specific handling instructions
 */

const d = require('../util/d'),

    db = require('monk')('mongod/gunpowder'),
    users = db.get('users'),
    cron = db.get('cron'),
    conf = db.get('conf'),
    times = db.get('times')

module.exports = {
    db: db,
    users: users,
    cron: cron,
    conf: conf,
    times: times,

    getSecret: function (cb) {
        conf.find({type: 'secret'}).then(secret => {
            if (secret.length === 1) {
                cb(secret[0].secret)
            } else {
                secret = require('randomstring').generate(128)
                conf.remove({type: 'secret'}).then(() => {
                    conf.insert({
                        type: 'secret',
                        secret: secret
                    })
                })
                cb(secret)
            }
        })
    },

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
        createAdmin: function (schema, password = require('randomstring').generate(12)) {
            users.find({username: 'admin'}).then(res => !!res[0] ? res[0]._id : false)
                .then(user => {
                    if (!user) {
                        d(`Creating a admin user with password: ${password}`)
                        users.insert(Object.assign({}, schema, {
                            username: 'admin',
                            password: password,
                            roles: [
                                'all'
                            ]
                        }))
                    }
                })
        }
    }
}

