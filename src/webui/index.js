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
    jwt = require('jsonwebtoken'),
    socketioJwt = require('socketio-jwt'),
    url = require('url'),
    db = require('../db')

global.THREAD_NAME = process.env.GP_THREAD_NAME || 'main'
global.PROJECT_ROOT = process.env.GP_PROJECT_ROOT || path.join(__dirname, '..', '..')

const d = require('../util/d'),
    secret = randomString.generate(128)

let app = express(),
    server = require('http').createServer(app),
    io = require('socket.io')(server)

const session = require('express-session'),
    NedbStore = require('nedb-session-store')(session)

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

let notifications = [
    // {
    //     type: 'New Player',
    //     time: 'Just now',
    //     message: 'A new player named _Qwop_ has joined the server'
    // },
    // {
    //     type: 'Hacker Player',
    //     time: '3 minutes ago',
    //     message: 'A red-flagged player named Zolluc has joined the server'
    // },
    // {
    //     type: 'Rare Player',
    //     time: '4 hours ago',
    //     message: 'A special player named DDWolfyCraft has joined the server'
    // }
]
function ifAuth(req, res, act) {
    if (!req.user) {
        res.redirect('/login')
    } else {
        act()
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
    ifAuth(req, res, () => res.render('console', {
        title: 'Console',
        user: req.user,
        token: jwt.sign(req.user, secret, {expiresIn: 60 * 60 * 5})
    }))
})
app.get('/users', function (req, res, next) {
    db.users.find({}).then(users => {
        ifAuth(req, res, () => res.render('users', {
            title: 'Users',
            user: req.user,

            users: users
        }))
    })

})


server.listen(8080, function () {
    d(`Listening on 8080`)
})

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
            if (history.length >= 500) history.shift()
            break
        case 'login':
            let n = n => n.toLocaleString('en-US', {minimumIntegerDigits: 2}),
                d = new Date()
            notifications.push({
                type: 'Player Joined',
                time: `${n(d.getHours())}:${n(d.getMinutes())}`,
                message: `${msg.user} has logged in`
            })
    }
})

io.on('connection', function (socket) {
    socket.on('command', cmd => process.send({
        dest: 'minecraft',
        msg: {
            act: 'command',
            cmd: cmd
        }
    }))
    history.forEach(t => socket.emit('console', t))
})