/**
 * index.js
 * This file was created on 10/02/17 by kkprince, and is
 * a part of gunpowder. This file may be proprietary,
 * however please se the LICENSE file in the root of this
 * project for specific handling instructions
 */

function d(...tt) {
    tt.forEach(t=>{
        console.log(
            typeof t === 'object'
                ? JSON.stringify(t, null, 2)
                : t
        )
    })
}

const express = require('express'),
    path = require('path')

let app = express()
app.use('/vendors', express.static(path.join(process.env.PROJECT_ROOT, 'node_modules', 'gentelella', 'vendors')))
app.use('/', express.static(path.join(process.env.PROJECT_ROOT, 'node_modules', 'gentelella', 'build')))

app.disable('view cache')
app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'src', 'views'))

app.get('/', function (req, res, next) {
    res.render('index', {title: 'Home'})
})
app.get('/console', function (req, res, next) {
    res.render('console', {title: 'Console'})
})

app.listen(8080, function () {
})