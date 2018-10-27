const express = require("express");
var bodyParser = require("body-parser");
const shell = require("shelljs");
const fs = require("file-system");

const mongoose = require("mongoose");

var sample = require("./sample");
var g = require("./googleFunctions");

var bigQuery = require("./bigQuery");
const polyFunc = require("./poly.js");
const mkp = require("./makePath.js");

//Message: export GOOGLE_APPLICATION_CREDENTIALS="./service-account-file.json"

var app = express();

app.use(bodyParser.json());

//TEST: "/get/certs" passed!!

app.post("/get/cert", (req, res) => {
  if (req.body.pass == "test") {
    shell.exec("chmod +x test.sh");
    shell.exec(`openssl req -x509 -newkey rsa:2048 -keyout ./certs/rsa_${
      req.body.user
    }_private.pem -nodes -out \
        ./certs/rsa_${req.body.user}_cert.pem -subj "/CN=unused"`);

    var options = {
      root: __dirname + "/",
      dotfiles: "deny",
      headers: {
        "x-timestamp": Date.now(),
        "x-sent": true
      }
    };

    g.getClient(Gclient => {
      console.log("HELLO");
      var opts = {
        deviceId: `${req.body.user.toString()}`,
        registryId: "location_emitters",
        projectId: "naughty-intern-1337",
        cloudRegion: "us-central1",
        rsaPath: `./certs/rsa_${req.body.user}_cert.pem`
      };
      g.createRsaDevice(
        Gclient,
        opts.deviceId,
        opts.registryId,
        opts.projectId,
        opts.cloudRegion,
        opts.rsaPath
      );
      setTimeout(() => {
        var fileName = `./certs/rsa_${req.body.user}_private.pem`;
        res.sendFile(fileName, options, function(err) {
          if (err) {
            // next(err);
            console.log(err);
          } else {
            console.log("Sent:", fileName);
          }
        });
      }, 100);
    });
  } else {
    res.status(400).send(JSON.stringify({ Error: "Not authorised" }));
  }
});

//TEST: "/websample" Passed !!

app.post("/websample", (req, res) => {
  var lat = req.body.lat;
  var lon = req.body.lon;
  var clientId = req.body.clientId;
  sample.sampleSend(lat, lon, clientId, isSent => {
    if (isSent) {
      res.status(200).send(JSON.stringify({ status: "sent" }));
    } else {
      res.status(400).send(JSON.stringify({ err: `err` }));
    }
  });
});

//TEST: "/query" PASSED !!

app.post("/query", (req, res) => {
  bigQuery.query(
    req.event,
    req.eventCriteria,
    req.cityName,
    req.timeEnd,
    req.timeStart,
    result => {
      if (result != "ERROR") {
        res.status(200).send(JSON.stringify(result));
      } else {
        res.status(400).send(JSON.stringify({ Error: "Error" }));
      }
    }
  );
});

//TEST: All good hopefully!!

app.post("/makepath", (req, res) => {
  mkp.pathMaker(req.body.origin, req.body.destination, path => {
    // console.log("sc2");
    fs.writeFile(
      `./paths/${req.body.pathName}.json`,
      JSON.stringify(path),
      err => {
        if (err) {
          console.log(err);
        }
      }
    );
    // var newPath = require(`./${req.body.pathName}.json`);

    res.status(200).send(JSON.stringify(path));
  });
  // console.log(pathJson);
});

app.post("/track", (req, res) => {});

//Message: Server Start!!
app.listen(3000, () => {
  console.log("Server up on 3000");
  // schema.find({ isActive: true }, activeCampaigns => {
  // realtime.serverStart(activeCampaigns, client, schema);
  // });
});
