/**
 * console
 * This file was created on 10/02/17 by kkprince, and is
 * a part of gunpowder. This file may be proprietary,
 * however please se the LICENSE file in the root of this
 * project for specific handling instructions
 */
let d = console.log

const entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
    '\t': '&nbsp&nbsp&nbsp&nbsp'
};

function escapeHtml(string) {
    return string.replace(/[&<>"'`=\/\t]/g, function (s) {
        return entityMap[s];
    });
}

function mcColor(replace) {
    let i = 0
    replace = replace.replace(/§(\d|\w)/g, (match, n) => {
        function getDivWithClass(classs) {
            return `<span class='mc ${classs}'>`
        }

        function closeDivs() {
            let ret = ''
            while (--i > 0) {
                ret += '</span>'
            }
            return ret
        }

        i++
        switch (n) {
            case '0':
                return getDivWithClass('mc-black')
            case '1':
                return getDivWithClass('mc-darkBlue')
            case '2':
                return getDivWithClass('mc-darkGreen')
            case '3':
                return getDivWithClass('mc-darkAqua')
            case '4':
                return getDivWithClass('mc-darkRed')
            case '5':
                return getDivWithClass('mc-darkPurple')
            case '6':
                return getDivWithClass('mc-gold')
            case '7':
                return getDivWithClass('mc-gray')
            case '8':
                return getDivWithClass('mc-dark')
            case '9':
                return getDivWithClass('mc-blue')
            case 'a':
                return getDivWithClass('mc-green')
            case 'b':
                return getDivWithClass('mc-aqua')
            case 'c':
                return getDivWithClass('mc-red')
            case 'd':
                return getDivWithClass('mc-lightPurple')
            case 'e':
                return getDivWithClass('mc-yellow')
            case 'f':
                return getDivWithClass('mc-white')
            case 'k':
                return getDivWithClass('')
            case 'l':
                return getDivWithClass('mc-bold')
            case 'm':
                return getDivWithClass('mc-strike')
            case 'n':
                return getDivWithClass('mc-underline')
            case 'o':
                return getDivWithClass('mc-italic')
            case 'r':
                return closeDivs()
            default:
                return ''
        }
    })
    return replace
}

window.onload = () => {
    socket = io.connect('', {
        query: 'token=' + token
    })

    jQuery(function ($) {
        $('#term').terminal(function (command) {
            socket.emit('command', command)
        }, {
            height: '75vh',
            width: '100%',
            greetings: false,
            onInit: t => {
                socket.on('console', msg => {
                    terminal = t
                    t.echo(
                        '<span>' + mcColor(escapeHtml(msg)) + '</span>', {
                            raw: true
                        })
                })
            }
        });
    })
}