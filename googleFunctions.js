const fs = require("file-system");
const jwt = require("jsonwebtoken");
const google = require("googleapis");
var PubSub = require("@google-cloud/pubsub");

const API_VERSION = "v1";
const DISCOVERY_API = "https://cloudiot.googleapis.com/$discovery/rest";
var serviceAccountJson = "./service-account-file.json";
const projectId = "naughty-intern-1337";

function createSubscription(topicName, subscriptionName, cb) {
  // Creates a new subscription
  const pubsub = new PubSub({
    projectId: projectId
  });
  pubsub
    .topic(topicName)
    .createSubscription(subscriptionName)
    .then(results => {
      const subscription = results[0];
      console.log(`Subscription ${subscription.name} created.`);
      cb();
    })
    .catch(err => {
      console.error("ERROR:", err);
    });

  // [END pubsub_create_pull_subscription]
}

function deleteSubscription(subscriptionName) {
  const pubsub = new PubSub({
    projectId: projectId
  });
  pubsub
    .subscription(subscriptionName)
    .delete()
    .then(() => {
      console.log(`Subscription ${subscriptionName} deleted.`);
    })
    .catch(err => {
      console.error("ERROR:", err);
    });
}

function getClient(cb) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountJson));
  const jwtAccess = new google.auth.JWT();
  // google.auth.jwt()
  // google.auth;
  jwtAccess.fromJSON(serviceAccount);
  // Note that if you require additional scopes, they should be specified as a
  // string, separated by spaces.
  jwtAccess.scopes = "https://www.googleapis.com/auth/cloud-platform";
  // Set the default authentication to the above JWT access.
  google.options({ auth: jwtAccess });

  const discoveryUrl = `${DISCOVERY_API}?version=${API_VERSION}`;

  google.discoverAPI(discoveryUrl, {}, (err, client) => {
    if (err) {
      console.log("Error during API discovery", err);
      return undefined;
    }
    cb(client);
  });
}

function createJwt(projectId, privateKeyFile, algorithm) {
  // Create a JWT to authenticate this device. The device will be disconnected
  // after the token expires, and will have to reconnect with a new token. The
  // audience field should always be set to the GCP project id.
  console.log(privateKeyFile);

  const token = {
    iat: parseInt(Date.now() / 1000),
    exp: parseInt(Date.now() / 1000) + 20 * 60, // 20 minutes
    aud: projectId
  };
  const privateKey = fs.readFileSync(privateKeyFile);
  // console.log(privateKey);

  return jwt.sign(token, privateKey, { algorithm: algorithm });
}

function createRsaDevice(
  client,
  deviceId,
  registryId,
  projectId,
  cloudRegion,
  rsaCertificateFile
) {
  // [START iot_create_rsa_device]
  // Client retrieved in callback
  // getClient(serviceAccountJson, function(client) {...});
  // const cloudRegion = 'us-central1';
  // const deviceId = 'my-rsa-device';
  // const projectId = 'adjective-noun-123';
  // const registryId = 'my-registry';
  const parentName = `projects/${projectId}/locations/${cloudRegion}`;
  const registryName = `${parentName}/registries/${registryId}`;
  const body = {
    id: deviceId,
    credentials: [
      {
        publicKey: {
          format: "RSA_X509_PEM",
          key: fs.readFileSync(rsaCertificateFile).toString()
        }
      }
    ]
  };

  const request = {
    parent: registryName,
    resource: body
  };

  console.log(JSON.stringify(request));

  client.projects.locations.registries.devices.create(request, (err, data) => {
    if (err) {
      console.log("Could not create device");
      console.log(err);
    } else {
      console.log("Created device");
      console.log(data);
    }
  });
  // [END iot_create_rsa_device]
}

module.exports.createRsaDevice = createRsaDevice;
module.exports.createJwt = createJwt;
module.exports.getClient = getClient;
module.exports.createSubscription = createSubscription;
