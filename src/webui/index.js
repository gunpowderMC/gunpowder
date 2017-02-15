/**
 * index.js
 * This file was created on 10/02/17 by kkprince, and is
 * a part of gunpowder. This file may be proprietary,
 * however please se the LICENSE file in the root of this
 * project for specific handling instructions
 */

const express = require('express'),
    path = require('path'),
    randomString = require('randomstring'),
    url = require('url'),
    db = require('../db'),
    jwt = require('jsonwebtoken'),
    session = require('express-session'),
    NedbStore = require('nedb-session-store')(session),

    capabilities = [
        'all',
        'user-admin',
        'console',
        'watch-players',
        'none'
    ],
    userSchema = {
        username: '',
        password: '',
        capabilities: ['none'],
        notifications: [],
        disabled: false
    }

global.THREAD_NAME = process.env.GP_THREAD_NAME || 'main'
global.PROJECT_ROOT = process.env.GP_PROJECT_ROOT || path.join(__dirname, '..', '..')

const d = require('../util/d')
global.secret = randomString.generate(128)

const app = express(),
    server = require('http').createServer(app),
    io = require('./src/socket')(server)

app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({extended: true}));
app.use(session({secret: secret, resave: false, saveUninitialized: false, store: new NedbStore()}));
require('./src/auth')(app)

app.use('/', express.static(path.join(__dirname, 'public')))

app.use('/vendors', express.static(path.join(PROJECT_ROOT, 'node_modules', 'gentelella', 'vendors')))
app.use('/', express.static(path.join(PROJECT_ROOT, 'node_modules', 'gentelella', 'build')))
app.use('/css', express.static(path.join(PROJECT_ROOT, 'node_modules', 'jquery.terminal', 'css')))
app.use('/js', express.static(path.join(PROJECT_ROOT, 'node_modules', 'jquery.terminal', 'js')))
app.use('/js/keyboardevent-key-polyfill', express.static(path.join(PROJECT_ROOT, 'node_modules', 'keyboardevent-key-polyfill')))

app.disable('view cache')
app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'src', 'views'))

function ifAuth(req, res, act) {
    if (!req.user) {
        res.redirect('/login')
    } else {
        act()
    }
}

function hasPerm(user, perm) {
    if (typeof user.capabilities !== 'undefined') {
        return (user.capabilities.indexOf('all') !== 1 || user.capabilities.indexOf(perm) !== 1)
    }
}

app.get('/', function (req, res, next) {
    ifAuth(req, res, () => res.render('index', {
        title: 'Home',
        user: req.user
    }))
})
app.get('/login', function (req, res, next) {
    res.render('login', {title: 'Login', failed: url.parse(req.url, true).query.incorrect === ''})
})
app.get('/logout', function (req, res, next) {
    req.session.destroy(() => {
    })
    res.redirect('/login')
})
app.get('/console', function (req, res, next) {
    ifAuth(req, res, () => {
        if (hasPerm(req.user, 'console')) {
            res.render('console', {
                title: 'Console',
                user: req.user,
                token: jwt.sign(req.user, secret, {expiresIn: 60 * 60 * 5})
            })
        } else {
            res.redirect('/')
        }
    })
})
app.get(/^\/users/, function (req, res, next) {
    ifAuth(req, res, () => {
        if (hasPerm(req.user, 'user-admin')) {
            let action = req.url.split('/').slice(2)
            if (action.length === 0) {
                db.users.find({}).then(users => {
                    res.render('users', {
                        title: 'Users',
                        user: req.user,

                        users: users
                    })
                })
            } else {
                switch (action[0]) {
                    case 'delete':
                        if (action[1] && action[1] !== 'admin' && action[1] !== req.user.username) {
                            db.users.remove({username: action[1]}).then(() => {
                                db.users.find({}).then(users => {
                                    res.render('users', {
                                        title: 'Users',
                                        user: req.user,
                                        alerts: [{
                                            type: 'info',
                                            message: `User Deleted: ${action[1]}`
                                        }],

                                        users: users
                                    })
                                })
                            })
                        } else {
                            db.users.find({}).then(users => {
                                res.render('users', {
                                    title: 'Users',
                                    user: req.user,
                                    alerts: [{
                                        type: 'warning',
                                        message: `User Invalid: ${action[1]}`
                                    }],

                                    users: users
                                })
                            })
                        }
                        break
                    case 'disable':
                        if (action[1] && action[1] !== req.user.username) {
                            db.users.update({username: action[1]}, {$set: {disabled: true}}).then(() => {
                                db.users.find({}).then(users => {
                                    res.render('users', {
                                        title: 'Users',
                                        user: req.user,
                                        alerts: [{
                                            type: 'info',
                                            message: `User Disabled: ${action[1]}`
                                        }],

                                        users: users
                                    })
                                })
                            })
                        } else {
                            db.users.find({}).then(users => {
                                res.render('users', {
                                    title: 'Users',
                                    user: req.user,
                                    alerts: [{
                                        type: 'warning',
                                        message: `User Invalid: ${action[1]}`
                                    }],

                                    users: users
                                })
                            })
                        }
                        break
                    case 'enable':
                        if (action[1]) {
                            db.users.update({username: action[1]}, {$set: {disabled: false}}).then(() => {
                                db.users.find({}).then(users => {
                                    res.render('users', {
                                        title: 'Users',
                                        user: req.user,
                                        alerts: [{
                                            type: 'info',
                                            message: `User Enabled: ${action[1]}`
                                        }],

                                        users: users
                                    })
                                })
                            })
                        } else {
                            db.users.find({}).then(users => {
                                res.render('users', {
                                    title: 'Users',
                                    user: req.user,
                                    alerts: [{
                                        type: 'warning',
                                        message: `User Invalid: ${action[1]}`
                                    }],

                                    users: users
                                })
                            })
                        }
                        break
                    case 'edit':
                        db.users.find({username: action[1]}).then(user => {
                            if (user.length !== 1) {
                                db.users.find({}).then(users => {
                                    res.render('users', {
                                        title: 'Users',
                                        user: req.user,
                                        alerts: [{
                                            type: 'warning',
                                            message: `User Invalid: ${action[1]}`
                                        }],

                                        users: users
                                    })
                                })
                            } else res.render('user', {
                                title: 'Edit: ' + action[1],
                                user: req.user,

                                u: user[0],
                                capabilities: capabilities
                            })
                        })
                        break
                    case 'new':
                        res.render('user', {
                            title: 'Edit: ' + action[1],
                            user: req.user,

                            capabilities: capabilities
                        })
                        break
                    default:
                        db.users.find({}).then(users => {
                            res.render('users', {
                                title: 'Users',
                                user: req.user,
                                alerts: [{
                                    type: 'danger',
                                    message: `Invalid action: ${action[0]}`
                                }],

                                users: users
                            })
                        })
                }
            }
        } else {
            res.render('index', {
                title: 'Home',
                user: req.user,

                alerts: [{
                    type: 'danger',
                    message: `You don't have permission to do that!`
                }]
            })
        }
    })
})
app.get('/settings', function (req, res) {
    ifAuth(req, res, () => res.render('user', {
        title: 'Edit: ' + req.user.username,
        user: req.user,

        u: req.user,
        capabilities: capabilities
    }))
})
app.post('/settings', function (req, res) {
    ifAuth(req, res, () => {
        let admin = hasPerm(req.user, 'user-admin')
        if (req.user.username === req.body.u || admin) {
            let update = {}
            if (admin) {
                if (Array.isArray(req.body.capabilities)) {
                    update.capabilities = req.body.capabilities
                } else {
                    update.capabilities = [req.body.capabilities]
                }

                update.disabled = typeof req.body.disabled !== "undefined"
                update.username = req.body.u
            }

            if (typeof req.body.p === 'string') update.password = req.body.p

            db.users.find({username: req.body.u}).then(user => {
                if (user.length > 1) {
                    res.render('index', {
                        title: 'Home',
                        user: req.user,
                        alerts: [{
                            type: 'warning',
                            message: `User Invalid: ${req.body.u}`
                        }]
                    })
                } else {
                    user = user[0]
                    db.users.update({username: req.body.u}, {$set: Object.assign({}, userSchema, user, update)}, {upsert: true})
                    res.render('index', {
                        title: 'Home',
                        user: req.user,
                        alerts: [{
                            type: 'info',
                            message: `User settings updated: ${req.body.u}`
                        }]
                    })
                }
            })
        } else {
            res.render('index', {
                title: 'Home',
                user: req.user,

                alerts: [{
                    type: 'danger',
                    message: `You don't have permission to do that!`
                }]
            })
        }
    })
})


server.listen(8080, function () {
    d(`Listening on 8080`)
})