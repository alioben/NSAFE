/**
 * Module dependencies.
 */
var Promise = require('bluebird');
var request = require('request');
var Db = require('mongodb').Db,
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server,
    ReplSetServers = require('mongodb').ReplSetServers,
    ObjectID = require('mongodb').ObjectID,
    Binary = require('mongodb').Binary,
    GridStore = require('mongodb').GridStore,
    Grid = require('mongodb').Grid,
    Code = require('mongodb').Code,
    // BSON = require('mongodb').pure().BSON,
    assert = require('assert');
const express = require('express');
var http = require('http');
var parseString = require('xml2js').parseString;
const compression = require('compression');
const session = require('express-session');
const bodyParser = require('body-parser');
const chalk = require('chalk');
const errorHandler = require('errorhandler');
const lusca = require('lusca');
const dotenv = require('dotenv');
const MongoStore = require('connect-mongo')(session);
const flash = require('express-flash');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const expressValidator = require('express-validator');
const expressStatusMonitor = require('express-status-monitor');
var geoTools = require('geo-tools');
var querystring = require('querystring');
/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.load({
    path: '.env'
});
/**
 * Create Express server.
 */
const app = express();
/**
 * Connect to MongoDB.
 */
var db = new Db('stops', new Server('50.116.48.206', 27017));
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/stops');
mongoose.connection.on('connected', () => {
    console.log('%s MongoDB connection established!', chalk.green('✓'));
});
mongoose.connection.on('error', () => {
    console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
    process.exit();
});
var stopSchema = new mongoose.Schema({
    stop_name: String,
    stop_lat: String,
    stop_lon: String
});
var Stops = mongoose.model('Stops', stopSchema);
var rateSchema = new mongoose.Schema({
    location: [Number, Number],
    rate: Number
});
var ratesModel = mongoose.model('Rates', rateSchema);

var commentSchema = new mongoose.Schema({
    location: [Number, Number],
    comment: String
});
var commentsModel = mongoose.model('Comments', commentSchema);
/**
 * Express configuration.
 */
app.set('port', process.env.PORT || 3000);
app.use(expressStatusMonitor());
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(expressValidator());
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET,
    store: new MongoStore({
        url: process.env.MONGODB_URI || process.env.MONGOLAB_URI,
        autoReconnect: true
    })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});
app.use(function(req, res, next) {
    // After successful login, redirect back to the intended page
    if (!req.user && req.path !== '/login' && req.path !== '/signup' && !req.path.match(/^\/auth/) && !req.path.match(/\./)) {
        req.session.returnTo = req.path;
    }
    next();
});
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: 31557600000
}));
/**
 * OAuth authentication routes. (Sign in)
 */
app.get('/auth/facebook', passport.authenticate('facebook', {
    scope: ['email', 'user_location']
}));
app.get('/auth/facebook/callback', passport.authenticate('facebook', {
    failureRedirect: '/login'
}), (req, res) => {
    res.redirect(req.session.returnTo || '/');
});
/**
 * Defining my primary routes here.
 */
// app.post('/location/', function(req, res) {
//     console.log(req.body); //should be JSON
//     res.send(distSort(req.body));
// });
// var promise1 = new Promise(function(resolve, reject) {
//     db.open(function(err, db1) {
//         if (err) {
//             reject(err);
//         }
//         var stops = [];
//         db1.collection('stops').find().each(function(err, item) {
//             console.log(item);
//             if (item == null) {
//                 resolve(stops);
//             } else {
//                 stops.push(item);
//             }
//         });
//     });
// });
// var distSort = function calculateDistance(location) {
//     var distanceList = [];
//     promise1.then(function(stops) {
//         console.log(contents);
//         for (stop in contents) {
//             var object = [stop[1], stop[2]];
//             distanceList.push(stop[0], distance(object, location));
//         }
//         var sortedVals = function getSortedKeys(distanceList) {
//             var keys = [];
//             for (var key in obj) keys.push(key);
//             return keys.sort(function(a, b) {
//                 return obj[a] - obj[b]
//             });
//         }
//         return sortedVals;
//     }).catch(function(err) {
//         console.log(err);
//     });
// };
/**
 * This function takes in as a POST the stop that the user is electing to go 
 * to. Using this information the Detroit DOT API is queried for the nearest 
 * bus to that location and the time to arrival is returned. If no such bus is 
 * found going to that stop, false is returned.
 * A sample input: 
 * { "_id" : ObjectId("57f88ec38d06beec95fbf2f1"), "stop_name" : "Harper & 
 * Conner", "stop_lat" : 42.397106, "stop_lon" :-82.989298 }
 */
app.post("/api/nextBus", function(req, res) {
    /** Longitude latitude bus station **/
    var longitude_bus;
    var latitude_bus;
    var endpoint = 'https://maps.googleapis.com/maps/api/directions/json?&mode=transit&origin='+origin;
    endpoint += 'destination='+destination+'&key=AIzaSyBLyhBEBnRBD5nFdu4Blw5k7IKYFV59MI0';
    var json = request(endpoint, callback);
    bus_element = json["routes"]["legs"]["steps"];
    bus_found = false;
    for(var i = 0; i < bus_element.length; i++){
        e = bus_element[i];
        if(e['travel_mode'] == 'TRANSIT' && e['line']['type'] == 'BUS'){
            bus_element = e;
            bus_found = true;
            break;
        }
    }

    if(bus_found){
        /** Remaining time **/
        var requestURL = "https://ddot-beta.herokuapp.com/api/api/where/vehicles-for-agency/DDOT.json?key=LIVEMAP";
        var returnedJSON = request(requestURL, callback);
        var englishStopName = req.body["stop_name"];
        var stopID = (returnedJSON["data"]["references"]["stops"]["name"]).equals(englishStopName);
        for (bus in returnedJSON["data"]["list"]) {
            if (bus["nextStop"].equals(stopID)) {
                return stop["nextStopTimeOffset"];
            }
        }
    }
    return false;
});

app.get("/api/trafficData", function(req, res) {
    /***** Get the visibility from the sky api *****/
    var latitude = req.body["from"][0];
    var longitude = req.body["from"][1];
    endpoint_darksky = 'https://api.darksky.net/forecast/dc0b864eaf08e3073401662ab0a3b463/'+latitude+','+longitude;
    var json = request(endpoint_darksky, callback);
    visibility = 0;
    for(var i = 0; i < json["hourly"]["data"].length; i++){
        var e = json["hourly"]["data"][i];
        visibility += e["visibility"];
    }
    visibility /= json["hourly"]["data"].length;
    visibility = (visibility/10)*4;

    /*** Get the hour ***/
    var d = new Date();
    var hour = d.getHours();

    /*** Real-Time data traffic ***/
    var requestURL = "http://api.cctraffic.net/feeds/map/Traffic.aspx?id=17&type=incident&max=25&bLat=42.203097639603264%2C42.459441175790076&bLng=-83.25866010742186%2C-82.83293989257811&sort=severity_priority%20asc";
    var xml = request(requestURL);
    console.log("XML: " + xml.body);
    var jsonTrafficData;
    parseString(xml, function(err, result) {
        jsonTrafficData = JSON.stringify(result);
    });

    var returnResponse = [];
    returnResponse.push(jsonTrafficData["location"]);
    returnResponse.push(jsonTrafficData["title"]);
    returnResponse.push(jsonTrafficData["description"]);
    console.log(returnResponse);
    res.send(returnResponse);
});

app.post("/api/putRate", function(req, res) {
    var lng = req.body["lng"];
    var lat = req.body["lat"];
    console.log("LAT" + req.body["lat"]);
    var rate = req.body["rate"];
    console.log(req.body);
    var location = [lat, lng];
    if (rate > 0) db.collection("Rates").insert({
        location: location,
        rate: rate
    });
    res.send("successful");
});

app.get("/api/getRate", function(req, res) {
    var allRates = db.collection("Rates").find();
    var val = Math.floor(0 + Math.random() * 6);
    console.log(val);
    res.send(String(val));
    // var myDocument = allRates.hasNext() ? allRates.next() : null;
    // var total = 0;
    // var count = 0;
    // if(myDocument){
    //     console.log("Current Rate: " + myDocument.rate);
    //     console.log("Current Rate repped as array: " + myDocument["rate"])
    //     total += myDocument.rate
    //     count++;
    // }
    // var average = (total/count);
    // res.send({"average" : average});
});

app.get("/api/putComment", function(req, res) {
    var lng = req.body["lng"];
    var lat = req.body["lat"];
    var comment = req.body["comment"];
    console.log(req.body);
    var location = [lat, lng];
    if (comment.length > 5) db.collection("Comments").insert({
        location: location,
        comment: comment
    });
    res.send("successful");
});

app.get("/api/getComment", function(req, res) {
    var comment = db.collection("Rates").findOne({});
    console.log("Comment for return: " + comment);
    res.send(comment);
});

var convertToXml = Promise.promisify(parseString);
var extractInfo = function(data) {
    console.log(data);
    if (data.CCTraffic.location) {
        return {
            title: data.CCTraffic.location[0].title,
            description: data.CCTraffic.location[0].description
        };
    } else {
        return "no incidents";
    }
};
var makeUrl = function(params) {
    return `http://api.cctraffic.net/feeds/map/Traffic.aspx?${querystring.stringify(params)}`;
};
app.get("/api/trafficData", function(req, res) {
        Promise.props({
            id: 17,
            type: "incident",
            max: 25,
            bLat: "42.203097639603264,42.459441175790076",
            bLng: "-83.25866010742186,-82.83293989257811",
            sort: "severity_priority asc"
        }).then(makeUrl).then(rp).then(convertToXml).then(extractInfo).then(res.send);
    })
    /**
     * Error Handler.
     */
app.use(errorHandler());
/**
 * Start Express server.
 */
app.listen(app.get('port'), () => {
    console.log('%s Express server listening on port %d in %s mode.', chalk.green('✓'), app.get('port'), app.get('env'));
});
module.exports = app;