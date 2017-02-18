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
    sessionStore = require('connect-mongodb-session')(session),

    roles = [
        'all',
        'user-admin',
        'server-mgmt',
        'cron',
        'console',
        'staff',
        'watch-players',
        'none'
    ]
global.userSchema = {
        username: '',
        password: undefined,
        roles: ['none'],
        notifications: [],
    disabled: false,
    player: false
    }

global.THREAD_NAME = process.env.GP_THREAD_NAME || 'main'
global.PROJECT_ROOT = process.env.GP_PROJECT_ROOT || path.join(__dirname, '..', '..')

const d = require('../util/d')

db.getSecret(s => {
    global.secret = s

    const app = express(),
        server = require('http').createServer(app),
        io = require('./src/socket')(server)

    app.use(require('cookie-parser')());
    app.use(require('body-parser').urlencoded({extended: true}));
    app.use(session({
        secret: secret, resave: false, saveUninitialized: false, store: new sessionStore({
            uri: 'mongodb://mongod:27017/gunpowder',
            collection: 'sessions'
        })
    }));
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
        if (typeof user.roles !== 'undefined') {
            return (user.roles.indexOf('all') !== 1 || user.roles.indexOf(perm) !== 1)
        }
    }

    function renderIndex(req, res, rend) {
        if (hasPerm(req.user, 'staff')) {
            res.render('index-staff', rend)
        } else {
            res.render('index', rend)
        }
    }
    app.get('/', function (req, res, next) {
        ifAuth(req, res, () => renderIndex(req, res, {
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
                                    roles: roles
                                })
                            })
                            break
                        case 'new':
                            res.render('user', {
                                title: 'Edit: ' + action[1],
                                user: req.user,

                                roles: roles
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
                renderIndex(req, res, {
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
            roles: roles
        }))
    })
    app.post('/settings', function (req, res) {
        ifAuth(req, res, () => {
            let admin = hasPerm(req.user, 'user-admin')
            if (req.user.username === req.body.u || admin) {
                let update = {}
                if (admin) {
                    if (Array.isArray(req.body.roles)) {
                        update.roles = req.body.roles
                    } else {
                        update.roles = [req.body.roles]
                    }

                    update.disabled = typeof req.body.disabled !== "undefined"
                    update.username = req.body.u
                }

                if (typeof req.body.p === 'string' && req.body.p !== '') update.password = req.body.p

                db.users.find({username: req.body.u}).then(user => {
                    if (user.length > 1) {
                        renderIndex(req, res, {
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
                        renderIndex(req, res, {
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
                renderIndex(req, res, {
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

    function reloadCron() {
        process.send({
            dest: 'cron',
            msg: {
                act: 'reload'
            }
        })
    }

    app.get(/^\/cron/, function (req, res, next) {
        ifAuth(req, res, () => {
            if (hasPerm(req.user, 'cron')) {
                let action = req.url.split('/').slice(2)
                if (action.length === 0) {
                    db.cron.find({}).then(crons => {
                        res.render('crons', {
                            title: 'Crons',
                            user: req.user,

                            crons: crons
                        })
                    })
                } else {
                    switch (action[0]) {
                        case 'delete':
                            if (action[1]) {
                                db.cron.remove({_id: action[1]}).then(() => {
                                    db.cron.find({}).then(crons => {
                                        res.render('crons', {
                                            title: 'Cron',
                                            user: req.user,
                                            alerts: [{
                                                type: 'info',
                                                message: `Cron Deleted: ${action[1]}`
                                            }],

                                            crons: crons
                                        })
                                    })
                                    reloadCron()
                                })
                            } else {
                                db.cron.find({}).then(crons => {
                                    res.render('crons', {
                                        title: 'Cron',
                                        user: req.user,
                                        alerts: [{
                                            type: 'warning',
                                            message: `Cron Invalid: ${action[1]}`
                                        }],

                                        crons: crons
                                    })
                                })
                            }
                            break
                        case 'disable':
                            if (action[1]) {
                                db.cron.update({_id: action[1]}, {$set: {disabled: true}}).then(() => {
                                    db.cron.find({}).then(crons => {
                                        res.render('crons', {
                                            title: 'Crons',
                                            user: req.user,
                                            alerts: [{
                                                type: 'info',
                                                message: `Cron Disabled: ${action[1]}`
                                            }],

                                            crons: crons
                                        })
                                    })
                                    reloadCron()
                                })
                            } else {
                                db.cron.find({}).then(crons => {
                                    res.render('crons', {
                                        title: 'Crons',
                                        user: req.user,
                                        alerts: [{
                                            type: 'warning',
                                            message: `User Invalid: ${action[1]}`
                                        }],

                                        crons: crons
                                    })
                                })
                            }
                            break
                        case 'enable':
                            if (action[1]) {
                                db.cron.update({_id: action[1]}, {$set: {disabled: false}}).then(() => {
                                    db.cron.find({}).then(crons => {
                                        res.render('crons', {
                                            title: 'Crons',
                                            user: req.user,
                                            alerts: [{
                                                type: 'info',
                                                message: `Cron Enabled: ${action[1]}`
                                            }],

                                            crons: crons
                                        })
                                    })
                                    reloadCron()
                                })
                            } else {
                                db.cron.find({}).then(crons => {
                                    res.render('crons', {
                                        title: 'Crons',
                                        user: req.user,
                                        alerts: [{
                                            type: 'warning',
                                            message: `Cron Invalid: ${action[1]}`
                                        }],

                                        crons: crons
                                    })
                                })
                            }
                            break
                        case 'edit':
                            db.cron.find({_id: action[1]}).then(cron => {
                                if (cron.length !== 1) {
                                    db.cron.find({}).then(crons => {
                                        res.render('crons', {
                                            title: 'Crons',
                                            user: req.user,
                                            alerts: [{
                                                type: 'warning',
                                                message: `Cron Invalid: ${action[1]}`
                                            }],

                                            crons: crons
                                        })
                                    })
                                } else res.render('cron', {
                                    title: 'Edit: ' + action[1],
                                    user: req.user,

                                    cron: cron[0],
                                    roles: roles
                                })
                            })
                            break
                        case 'new':
                            res.render('cron', {
                                title: 'Edit: ' + action[1],
                                user: req.user,

                                cron: {}
                            })
                            break
                        default:
                            db.cron.find({}).then(crons => {
                                res.render('crons', {
                                    title: 'Crons',
                                    user: req.user,
                                    alerts: [{
                                        type: 'danger',
                                        message: `Invalid action: ${action[0]}`
                                    }],

                                    crons: crons
                                })
                            })
                    }
                }
            } else {
                renderIndex(req, res, {
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
    app.post(/^\/cron\/edit\/\w+/, function (req, res) {
        ifAuth(req, res, function () {
            if (hasPerm(req.user, 'cron')) {
                Object.assign(req.body, {disabled: typeof req.body.disabled === 'undefined' || req.body.disabled === ''})
                if (req.url === '/cron/edit/new') {
                    db.cron.insert(req.body)
                } else {
                    db.cron.update({_id: req.url.match(/^\/cron\/edit\/(\w+)/)[1]}, req.body)
                }
                reloadCron()
                res.redirect('/cron')
            }
        })
    })

    app.get(/^\/server/, (req, res) => {
        ifAuth(req, res, function () {
            if (hasPerm(req.user, 'server-mgmt')) {
                switch (req.url.match(/^\/server\/(\w+)/)[1]) {
                    case 'stop':
                        process.send({
                            dest: 'minecraft',
                            msg: {
                                act: 'stop'
                            }
                        })
                        break
                    case 'restart':
                        process.send({
                            dest: 'minecraft',
                            msg: {
                                act: 'restart'
                            }
                        })
                        break
                    case 'start':
                        process.send({
                            dest: 'minecraft',
                            msg: {
                                act: 'start'
                            }
                        })
                        break
                }
                res.redirect('/')
            }
        })
    })

    server.listen(8080, function () {
        d(`Listening on 8080`)
    })
})