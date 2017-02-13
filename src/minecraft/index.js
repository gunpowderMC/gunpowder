/**
 * index
 * This file was created on 11/02/17 by kkprince, and is
 * a part of gunpowder. This file may be proprietary,
 * however please se the LICENSE file in the root of this
 * project for specific handling instructions
 */


global.THREAD_NAME = process.env.GP_THREAD_NAME || 'minecraft'
const d = require('../util/d'),
    mcDownload = require('../util/minecraftDownload')

const jar = typeof process.env.MINECRAFT_JAR !== "undefined"
    ? process.env.MINECRAFT_JAR
    : 'minecraft.jar'

mcDownload(jar, undefined, e => d(e ? e : 'Done Successfully'))