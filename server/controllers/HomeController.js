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
        try {
            let playList = await playListModel.getAll()
            log.debug("home-view", playList)
            res.send({status: `OK`, data: playList})
        } catch (error) {
            console.error('Error fetching playlist:', error);
            res.status(500).send({status: `NG`, error: 'Failed to fetch playlist'})
        }
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
        
        // Validate required fields
        if (!trackParams.title || !trackParams.url) {
            return res.status(400).send({status: `NG`, error: 'Title and URL are required'})
        }
        
        // Validate URL format (basic YouTube URL check)
        const youtubeUrlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
        if (!youtubeUrlPattern.test(trackParams.url)) {
            return res.status(400).send({status: `NG`, error: 'Invalid YouTube URL'})
        }
        
        // Sanitize inputs to prevent XSS
        trackParams.title = String(trackParams.title).substring(0, 200); // Limit title length
        trackParams.message = trackParams.message ? String(trackParams.message).substring(0, 500) : ''; // Limit message length
        
        console.log({trackParams});
        trackParams.add_datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss")
        
        try {
            await playListModel.add(trackParams)
            res.send({status: `OK`, data: trackParams})
        } catch (error) {
            console.error('Error adding track:', error);
            res.status(500).send({status: `NG`, error: 'Failed to add track'})
        }
    }
]


exports.update = [
    async (req, res, next) => {
        // await playListModel.update(`ZhLltFkCSyjF4jDb0VFJ`, {play_status: 'playing'})
        res.status(200).send({message: `OK`})
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

exports.testapi = [
    async (req, res, next) => {
        
        let trackParams = req.body
        
        console.log(`api request ok..`);
        console.log({trackParams});

        return res.status(200).send({message: `done`});
    }
]