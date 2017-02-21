/**
 * index
 * This file was created on 20/02/17 by kkprince, and is
 * a part of gunpowder. This file may be proprietary,
 * however please se the LICENSE file in the root of this
 * project for specific handling instructions
 */

const express = require('express'),
    router = express.Router(),
    path = require('path')
module.exports = app => {
    app.use('/vendors', express.static(path.join(PROJECT_ROOT, 'node_modules', 'gentelella', 'vendors')))
    app.use('/', express.static(path.join(PROJECT_ROOT, 'node_modules', 'gentelella', 'build')))
    app.use('/css', express.static(path.join(PROJECT_ROOT, 'node_modules', 'jquery.terminal', 'css')))
    app.use('/js', express.static(path.join(PROJECT_ROOT, 'node_modules', 'jquery.terminal', 'js')))
    app.use('/js/keyboardevent-key-polyfill', express.static(path.join(PROJECT_ROOT, 'node_modules', 'keyboardevent-key-polyfill')))

    app.use('/vendor/vis', express.static(path.join(PROJECT_ROOT, 'node_modules/vis/dist')))
}