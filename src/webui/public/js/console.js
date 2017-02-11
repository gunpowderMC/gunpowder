/**
 * console
 * This file was created on 10/02/17 by kkprince, and is
 * a part of gunpowder. This file may be proprietary,
 * however please se the LICENSE file in the root of this
 * project for specific handling instructions
 */

jQuery(function ($) {
    $('#term').terminal(function (command) {
        this.echo(command + command + command + command + command + command + command + command)
    }, {
        height: '75vh',
        width: '100%',
        onInit: t => t.clear()
    });
})