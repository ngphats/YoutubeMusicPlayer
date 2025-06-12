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
const { graphqlHTTP } = require("express-graphql")
const { buildSchema } = require("graphql")

// Firebase admin default setting
const admin = require('firebase-admin')
const serviceAccount = require(`./credentials/firestore-koi-streaming.json`)
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

// const firebaseConfig = {
//     apiKey: "AIzaSyASmiJObRSfIJAIkOh98E8a89Wel9ILBj0",
//     authDomain: "phatnn-firstproject.firebaseapp.com",
//     projectId: "phatnn-firstproject",
//     storageBucket: "phatnn-firstproject.appspot.com",
//     messagingSenderId: "760386135946",
//     appId: "1:760386135946:web:35a3a3b1637e294dc10a73",
//     measurementId: "G-KCH1HXW8GY"
//   };
  
// // Initialize Firebase
// admin.initializeApp(firebaseConfig);

const dbAdmin = admin.firestore();
const { getAuth } = require('firebase-admin/auth');

const routerView = require("./server/router");
const routerApi = require("./server/router/api");
const service = require('./server/services');

app.use('/', express.static(__dirname + '/node_modules/bootstrap/dist/css'));
app.use('/', express.static(__dirname + '/node_modules/bootstrap/dist/js'));
app.use('/', express.static(__dirname + '/node_modules/jquery/dist'));
app.use('/', express.static(__dirname + '/node_modules/@popperjs/core/dist/umd'));

// const resolve = (file) => path.resolve(__dirname, file);
// app.use("/dist", express.static(resolve("./dist")));


// Construct a schema, using GraphQL schema language
var schema = buildSchema(`
  type Query {
    hello: String
  }
`)

// The root provides a resolver function for each API endpoint
var root = {
  hello: () => {
    return "Hello world!"
  },
}

app.use(
  "/graphql",
  graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
  })
)

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
app.use(routerView);

const authorizationJWT = async (req, res, next) => {
    // console.log({ authorization: req.headers.authorization });
    const authorizationHeader = req.headers.authorization;

    // let bodyParams = req.body;
    // let headerParams = req.headers;

    // console.log({bodyParams});
    // console.log({headerParams});
  
    if (authorizationHeader) {
      const accessToken = authorizationHeader.split(' ')[1];

      console.log({accessToken})
  
      getAuth()
        .verifyIdToken(accessToken)
        .then((decodedToken) => {
          console.log({ decodedToken });
          res.locals.uid = decodedToken.uid;
          next();
        })
        .catch((err) => {
          console.log({ err });
          return res.status(403).json({ message: 'Forbidden', error: err });
        });
    } else {
        next();
        // return res.status(401).json({ message: 'Unauthorized' });
    }
};

app.use(authorizationJWT);

// Routes
app.use(routerApi);

// setting cors
app.use(cors());

app.get("/test", function (req, res) {
    return res.status(200).json({ message: 'Hello world!' });
});

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

if (require.main === module) {
    server.listen(server_port, function () {
        console.log(`connecting with port:${server_port}`);
    });
}

module.exports = app;
