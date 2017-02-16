/**
 * cron.js
 * This file was created on 16/02/17 by kkprince, and is
 * a part of gunpowder. This file may be proprietary,
 * however please se the LICENSE file in the root of this
 * project for specific handling instructions
 */
function reloadSection() {
    let types = ['command', 'backup']

    types.forEach(type => $(`#${type}-section`).hide())

    $(`#${$('#type').val()}-section`).show()
}
$('#type').on('change', reloadSection)
reloadSection()