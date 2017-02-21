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