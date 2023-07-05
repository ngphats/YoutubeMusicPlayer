const express = require('express')
const router = express.Router()
const homeController = require('../controllers/HomeController')

router.post("/update", homeController.update)

module.exports = router