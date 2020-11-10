const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParse = require("body-parser");
const session = require("express-session");
const { appConfig } = require("./config/app");
const app = express();
const router = require("./server/router");
const archiver = require('archiver');

const resolve = (file) => path.resolve(__dirname, file);
app.use("/dist", express.static(resolve("./dist")));
app.use(bodyParse.json());
app.use(bodyParse.urlencoded({ extended: true }));

// session
app.set("trust proxy", 1); // trust first proxy
app.use(
    session({
        secret: "token",
        resave: false,
        saveUninitialized: true,
        cookie: {
            secure: true,
            maxAge: 2592000000,
        },
    })
);

function zip() {
    var output = fs.createWriteStream('target.zip');
    var archive = archiver('zip');
    
    output.on('close', function () {
        console.log(archive.pointer() + ' total bytes');
        console.log('archiver has been finalized and the output file descriptor has closed.');
    });
    
    archive.on('error', function(err){
        throw err;
    });
    
    archive.pipe(output);
    
    // append files from a sub-directory, putting its contents at the root of archive
    archive.directory(__dirname+'/data/', false);
    
    // append files from a sub-directory and naming it `new-subdir` within the archive
    //archive.directory(__dirname+'/data/', 'subdir');
    
    archive.finalize();
}

zip()

app.get("*", function (req, res) {
    let html = fs.readFileSync(resolve("./public/" + "index.html"), "utf-8");
    res.send(html);
});

// Routes
app.use(router)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error("Not Found");
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.send(err);
});

app.listen(8081, function () {
    console.log("connecting localhost:8081");
});
