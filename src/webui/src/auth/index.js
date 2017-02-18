/**
 * index
 * This file was created on 13/02/17 by kkprince, and is
 * a part of gunpowder. This file may be proprietary,
 * however please se the LICENSE file in the root of this
 * project for specific handling instructions
 */
const d = require('../../../util/d'),
    passport = require('passport'),
    Strategy = require('passport-local').Strategy,
    db = require('../../../db')
db.user.createAdmin(userSchema)
module.exports = function (app) {
    passport.use(new Strategy({},
        (username, password, cb) => {
            db.user.validate(username, password, res => cb(null, res))
        }
    ))

    passport.serializeUser(function (user, cb) {
        cb(null, user._id);
    });

    passport.deserializeUser(function (id, cb) {
        db.user.getFromId(id, user => cb(null, user))
    });
// Initialize Passport and restore authentication state, if any, from the
// session.
    app.use(passport.initialize());
    app.use(passport.session());
    app.post('/login',
        passport.authenticate('local', {failureRedirect: '/login?incorrect'}),
        function (req, res) {
            res.redirect('/');
        }
    )
}