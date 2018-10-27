var request = require("request");

var origin = "India+Gate";
var destination = "Rajeev+Chowk";

var pathMaker = (origin, destination, cb) => {
  request.get(
    `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=AIzaSyAmXKb4SbPsIq-pKNNTCm0lSGtJtYcVeaw`,
    (err, res, body) => {
      //   console.log(res.statusCode);

      //   console.log(res.body);
      var pathArray = [];
      JSON.parse(res.body).routes[0].legs[0].steps.forEach(step => {
        pathArray.push(step.end_location);

        // console.log(JSON.parse(step).end_point);
        // console.log("suces");

        // pathArray.push(step.end_point);
      });
      cb(pathArray);
    }
  );
};

var calDistance = (loc1, loc2) => {
  var distance = Math.sqrt((loc1.lat - loc2.lat) * (loc1.lat - loc2.lat));
  return distance;
};

var minDistance = (latLongArray, loc) => {
  var distance = 10000000000000000000000000;
  latLongArray.forEach(element => {
    if (distance > calDistance(loc, element)) {
      distance = calDistance(loc, element);
    }
    return distance;
  });
};

// var track = ()
// pathMaker(origin, destination);

module.exports.pathMaker = pathMaker;
