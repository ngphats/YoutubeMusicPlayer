const express = require("express");
const fs = require("fs");
const path = require("path");
require('dotenv').config();
const bodyParse = require("body-parser");
const session = require("express-session");
const cors = require('cors')
const app = express();
const http = require('http');
const https = require('https');
const server = http.createServer(app);
const io = require('socket.io')(server);

// Firebase admin default setting
const admin = require('firebase-admin')
const serviceAccount = require(`./credentials/firestore-koi-streaming.json`)
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})
const dbAdmin = admin.firestore();

const router = require("./server/router");
const service = require('./server/services');

app.use('/', express.static(__dirname + '/node_modules/bootstrap/dist/css'));
app.use('/', express.static(__dirname + '/node_modules/bootstrap/dist/js'));
app.use('/', express.static(__dirname + '/node_modules/jquery/dist'));
app.use('/', express.static(__dirname + '/node_modules/@popperjs/core/dist/umd'));

// const resolve = (file) => path.resolve(__dirname, file);
// app.use("/dist", express.static(resolve("./dist")));

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

app.use(express.static('./public'));

// set the view engine to ejs
app.set('view engine', 'ejs');
app.set('views', './views');

// Routes
app.use(router)

// setting cors
app.use(cors({
    origin:[
        "https://www.youtube.com/*",
        "https://www.google.com/*"
    ], 
    credentials: true
}));

// app.get("/html", function (req, res) {
//     let html = fs.readFileSync(resolve("./public/" + "index.html"), "utf-8");
//     res.send(html);
// });

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

// Socket listen...
service.socket.events(io, dbAdmin);

const server_port = process.env.SERVER_PORT;
server.listen(server_port, function () {
    console.log(`connecting with port:${server_port}`);
});

// // This line is from the Node.js HTTPS documentation.
// var options = {
//     key: fs.readFileSync('./path/test-ssl.local.key'),
//     cert: fs.readFileSync('./path/test-ssl.local.crt')
// };

// // Create an HTTPS service identical to the HTTP service.
// https.createServer(options, app).listen(4433);