const fs = require("fs")

exports.home = [
    async (req, res, next) => {
        res.render('home')
    }
]