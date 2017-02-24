/**
 * index
 * This file was created on 22/02/17 by kkprince, and is
 * a part of gunpowder. This file may be proprietary,
 * however please se the LICENSE file in the root of this
 * project for specific handling instructions
 */

global.PROJECT_ROOT = process.env.GP_PROJECT_ROOT || path.join(__dirname, '..', '..')
global.THREAD_NAME = process.env.GP_THREAD_NAME || 'Module Loader'

const d = require('../util/d'),
    child_process = require('child_process'),
    fs = require('fs')


