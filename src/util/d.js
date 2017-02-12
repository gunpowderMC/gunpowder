/**
 * d
 * This file was created on 11/02/17 by kkprince, and is
 * a part of gunpowder. This file may be proprietary,
 * however please se the LICENSE file in the root of this
 * project for specific handling instructions
 */

function d(...tt) {
    function pre() {
        let d = new Date()
        return `[${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}:${d.getMilliseconds()}]` +
            (typeof THREAD_NAME !== 'undefined'
                ? ` [${THREAD_NAME}]`
                : '')
    }

    tt.forEach(t => {
        console.log(pre() + ' ' +
            (typeof t === 'object'
                ? JSON.stringify(t, null, 2)
                : t)
        )
    })
}

module.exports = d