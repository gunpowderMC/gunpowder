/**
 * index
 * This file was created on 20/02/17 by kkprince, and is
 * a part of gunpowder. This file may be proprietary,
 * however please se the LICENSE file in the root of this
 * project for specific handling instructions
 */
let timeline
$(() => {
    let playerTimes = document.getElementById('playerTimes');
    $.get('/api/time', undefined, time => {
        time = new vis.DataSet(time)
        timeline = new vis.Timeline(playerTimes, time, {
            height: '100%'
        });
    })
})
function dateOp(d, days) {
    d.setDate(d.getDate() + days);
    return Math.floor(d.valueOf() / 1000)
}
$('#time').change(function () {
    let start = dateOp(new Date(this.value), -1),
        end = dateOp(new Date(this.value), 1)
    $.get(`/api/time/${start}/${end}`, undefined, time => {
        timeline.setItems(time)
        timeline.fit()
    })
})