/**
 * index
 * This file was created on 13/02/17 by kkprince, and is
 * a part of gunpowder. This file may be proprietary,
 * however please se the LICENSE file in the root of this
 * project for specific handling instructions
 */
const d = require('../../../util/d'),
    passport = require('passport'),
    Strategy = require('passport-local').Strategy
module.exports = function (app) {
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
}