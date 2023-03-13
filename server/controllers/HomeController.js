const fs = require("fs")

const log = require("../library/Log")
const playListModel = require("../models/PlayListModel")

exports.home = [
    async (req, res, next) => {
        res.render('home')
    }
]

exports.view = [
    async (req, res, next) => {
        let playList = await playListModel.getAll()
        log.debug("home", playList)

        res.send({status: `OK`, data: playList})
        res.end()
    }
]


exports.add = [
    async (req, res, next) => {
        
        let addInfo = {
            title: 'Hà Anh Tuấn',
            link: "https://www.youtube.com/watch?v=2QgDXI2U3Ew&ab_channel=TProduction",
            play_status: 'waiting',
            message: 'Buổi chiều vui vẻ!',
            sort_order: 3
        }

        await playListModel.add(addInfo)
 
        res.send({status: `OK`, data: addInfo})
        res.end()
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