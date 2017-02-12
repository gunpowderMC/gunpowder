/**
 * index.js
 * This file was created on 10/02/17 by kkprince, and is
 * a part of gunpowder. This file may be proprietary,
 * however please se the LICENSE file in the root of this
 * project for specific handling instructions
 */

global.THREAD_NAME = process.env.GP_THREAD_NAME

const d = require('../util/d')

const express = require('express'),
    path = require('path')

let app = express()
app.use('/', express.static(path.join(__dirname, 'public')))

app.use('/vendors', express.static(path.join(process.env.GP_PROJECT_ROOT, 'node_modules', 'gentelella', 'vendors')))
app.use('/', express.static(path.join(process.env.GP_PROJECT_ROOT, 'node_modules', 'gentelella', 'build')))
app.use('/css', express.static(path.join(process.env.GP_PROJECT_ROOT, 'node_modules', 'jquery.terminal', 'css')))
app.use('/js', express.static(path.join(process.env.GP_PROJECT_ROOT, 'node_modules', 'jquery.terminal', 'js')))

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
    res.render('index', {title: 'Home', notifications: notifications})
})
app.get('/console', function (req, res, next) {
    res.render('console', {title: 'Console', notifications: notifications})
})

app.listen(8080, function () {
    d(`Listening on 8080`)
})