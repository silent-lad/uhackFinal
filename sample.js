const mqtt = require("mqtt");
const g = require("./googleFunctions");

var sampleSend = (lat, lon, clientId, cb) => {
  const privateKeyFile = "./certs/rsa_private.pem";
  const mqttClientId = `projects/naughty-intern-1337/locations/us-central1/registries/location_emitters/devices/location_emitter_1`;
  let connectionArgs = {
    host: "mqtt.googleapis.com",
    port: 8883,
    clientId: mqttClientId,
    username: "unused",
    password: g.createJwt("naughty-intern-1337", privateKeyFile, "RS256"),
    protocol: "mqtts",
    secureProtocol: "TLSv1_2_method"
  };
  let client = mqtt.connect(connectionArgs);
  client.subscribe(`/devices/location_emitter_1/events`);
  client.on("connect", success => {
    if (success) {
      // console.log(req.body);
      payload = Buffer.from(
        JSON.stringify({
          clientId: `${clientId}`,
          latitude: lat,
          longitude: lon,
          time: Date.now() / 1000
        })
      );
      console.log(payload);

      client.publish(
        "/devices/location_emitter_1/events",
        payload,
        { qos: 0 },
        function(err) {
          if (err) {
            console.log(err);
            // res.send(JSON.stringify(err));
            cb(false);
          } else {
            console.log("Message code");
            // res.status(200).send(JSON.stringify({ status: "sent" }));
            cb(true);
            console.log("SENT");
          }
        }
      );
    } else {
      console.log("Error");
      cb(false);
    }
    // payload = `location_emitters/location_emitter_1-payload-${messagesSent}`
  });
};

module.exports.sampleSend = sampleSend;
