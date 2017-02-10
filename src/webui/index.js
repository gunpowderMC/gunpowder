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

['exit', 'SIGINT', 'SIGHUP', 'SIGTERM', 'uncaughtException'].forEach(signal=>process.on(signal, ()=>{
    d('HAHA u suk')
}))

setInterval(()=>{},50000)