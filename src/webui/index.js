/**
 * index.js
 * This file was created on 10/02/17 by kkprince, and is
 * a part of gunpowder. This file may be proprietary,
 * however please se the LICENSE file in the root of this
 * project for specific handling instructions
 */

const express = require('express'),
    path = require('path'),
    passport = require('passport'),
    Strategy = require('passport-local').Strategy

global.THREAD_NAME = process.env.GP_THREAD_NAME || 'main'
global.PROJECT_ROOT = process.env.GP_PROJECT_ROOT || path.join(__dirname, '..', '..')

const d = require('../util/d'),
    secret = require('randomstring').generate()

let app = express(),
    server = require('http').createServer(app),
    io = require('socket.io')(server)

const session = require('express-session'),
    NedbStore = require('nedb-session-store')(session)

app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({extended: true}));
app.use(session({secret: secret, resave: false, saveUninitialized: false, store: new NedbStore()}));

passport.use(new Strategy({},
    (username, password, cb) => {
        d(username, password, cb)
        cb(null, {id: 0})
    }
))

passport.serializeUser(function (user, cb) {
    cb(null, 0);
});

passport.deserializeUser(function (id, cb) {
    cb(null, {id: 0});
});
// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());
app.post('/login', (a, b, next) => {
        d('post');
        next()
    },
    passport.authenticate('local', {failureRedirect: '/login?incorrect=true'}),
    function (req, res) {
        res.redirect('/');
    }
)



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
    {
        type: 'New Player',
        time: 'Just now',
        message: 'A new player named _Qwop_ has joined the server'
    },
    {
        type: 'Hacker Player',
        time: '3 minutes ago',
        message: 'A red-flagged player named Zolluc has joined the server'
    },
    {
        type: 'Rare Player',
        time: '4 hours ago',
        message: 'A special player named DDWolfyCraft has joined the server'
    }
]

app.get('/', function (req, res, next) {
    if (!req.user) {
        res.redirect('/login')
    } else {
        res.render('index', {title: 'Home', notifications: notifications})
    }
})
app.get('/login', function (req, res, next) {
    res.render('login', {title: 'Home', notifications: notifications})
})
app.get('/console', function (req, res, next) {
    res.render('console', {title: 'Console', notifications: notifications})
})

server.listen(8080, function () {
    d(`Listening on 8080`)
})

let history = []
process.on('message', (msg, sendHandle) => {
    switch (msg.act) {
        case 'console':
            io.emit('console', msg.text)
            history.push(msg.text)
            if (history.length >= 500) history.shift()
            break
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