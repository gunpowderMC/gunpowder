/**
 * test
 * This file was created on 11/02/17 by kkprince, and is
 * a part of gunpowder. This file may be proprietary,
 * however please se the LICENSE file in the root of this
 * project for specific handling instructions
 */

function d(...tt) {
    function date() {
        let d = new Date()
        return `[${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}:${d.getMilliseconds()}]`
    }

    tt.forEach(t => {
        console.log(date() + ' ' +
            (typeof t === 'object'
                ? JSON.stringify(t, null, 2)
                : t)
        )
    })
}

d('hi')

setInterval(() => {
}, 500000)
process.on('message', (msg, sendHandle) => {
    d(msg)
})
process.send({
    dest: 'test', msg: {
        text: 'Boomerang'
    }
})