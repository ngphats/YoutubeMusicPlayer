const fs = require("fs")
const dateFormat = require("dateformat")

const log = require("../library/Log")
const playListModel = require("../models/PlayListModel")


exports.home = [
    async (req, res, next) => {
        res.render('home', {serverURL: process.env.SOCKET_SERVER})
    }
]


exports.view = [
    async (req, res, next) => {
        let playList = await playListModel.getAll()
        log.debug("home-view", playList)

        res.send({status: `OK`, data: playList})
        res.end()
    }
]


// let addInfo = {
//     title: 'Hà Anh Tuấn',
//     url: "https://www.youtube.com/watch?v=2QgDXI2U3Ew",
//     play_status: 'waiting',
//     message: 'Buổi chiều vui vẻ!',
// }
exports.add = [
    async (req, res, next) => {
        let trackParams = req.body
        log.debug("home-add", {trackParams})
        if (trackParams.title && trackParams.url) {
            trackParams.play_status = 'waiting'
            trackParams.add_datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss")
            await playListModel.add(trackParams)
            res.send({status: `OK`, data: trackParams})
            res.end()
        } else {
            res.send({status: `NG`})
            res.end()
        }
    }
]


exports.update = [
    async (req, res, next) => {
        await playListModel.update(`ZhLltFkCSyjF4jDb0VFJ`, {play_status: 'playing'})
        res.send({status: `OK`})
        res.end()
    }
]


exports.delete = [
    async (req, res, next) => {
        let playList = await playListModel.getAll()
        log.debug("home", playList)

        res.send({status: `OK`, data: playList})
        res.end()
    }
]


exports.sort = [
    async (req, res, next) => {
        let playList = await playListModel.getAll()
        log.debug("home", playList)

        res.send({status: `OK`, data: playList})
        res.end()
    }
]