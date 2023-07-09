const express = require('express')
const router = express.Router()
const homeController = require('../controllers/HomeController')

router.get("/", homeController.home)

router.post("/view", homeController.view)
router.post("/add", homeController.add)
router.post("/testapi", homeController.testapi)

// router.post("/update", homeController.update)

module.exports = router