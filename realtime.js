var PubSub = require("@google-cloud/pubsub");
var redis = require("redis");
const projectId = "naughty-intern-1337";
const fs = require("file-system");
const BigQuery = require("@google-cloud/bigquery");
var g = require("./googleFunctions");

const polyFunc = require("./poly.js");

//Message: Make clientID and campaginID numbers(INTEGERS) everywhere

function createCampaign(
  campaignName,
  polygon,
  duration, //In milliseconds
  event,
  eventCriteria,
  client,
  cb
) {
  const pubsub = new PubSub({
    projectId: projectId
  });
  console.log(campaignName);

  const topicName = "IotDataTopic";
  const subscriptionName = campaignName;

  const bigquery = new BigQuery({
    projectId: projectId
  });

  g.createSubscription(topicName, subscriptionName, () => {
    const subscription = pubsub.subscription(subscriptionName);

    console.log(1);

    pubsub
      .createTopic(`${subscriptionName}Result`)
      .then(results => {
        const topic = results[0];
        console.log(`Topic ${topic.name} created.`);
        resultTopic = topic.name;
        cb(true);
      })
      .catch(err => {
        console.error("ERROR:", err);
        cb(false);
      });
    console.log(2);
    console.log(subscription);

    let messageCount = 0;
    const messageHandler = message => {
      messageCount += 1;
      var phone = JSON.parse(message.data.toString()).clientId.splice(0, 1); //As First letter will  be "A"
      var lat = JSON.parse(message.data.toString()).latitude;
      var lon = JSON.parse(message.data.toString()).longitude;
      var poly = require(`./polygons/${polygon}`);
      if (
        JSON.parse(message.data.toString()).event == event &&
        polyFunc(lat, lon, poly.polygon)
      ) {
        // Both initiates and increases phone number key inside campaignName hash
        client.hincrby(`${campaignName}`, `${phone}`, 1, (err, reply) => {
          if (reply > eventCriteria) {
            console.log(reply);
            let dataBuffer = Buffer.from(reply);
            pubsub
              .topic(resultTopic)
              .publisher()
              .publish(dataBuffer)
              .then(messageId => {
                console.log(`Message ${messageId} published:- ${reply}`);
              })
              .catch(err => {
                console.error("ERROR:", err);
              });
            bigquery
              .dataset("IotData")
              .table(`CampaignResults`)
              .insert({
                timastamp: Date.now() / 1000,
                clientId: phone,
                campaignId: campaignName
              });
          }
        });
      }
      message.ack();
    };
    console.log(4);

    subscription.on(`message`, messageHandler);
  });
}

function serverStart(activeCampaigns, client, campaignDB) {
  if (activeCampaigns == null) {
    return;
  }
  activeCampaigns.forEach(campaign => {
    var endtime = campaign.endtime;
    var remainingTime = endtime - Date.now();
    const pubsub = new PubSub({
      projectId: projectId
    });
    var polyName = campaign.polygon;
    var poly = require(`./polygons/${polyName}`);
    const topicName = "IotDataTopic";
    const subscription = pubsub.subscription(`${campaign.campaignName}`);
    var resultTopic = `${campaign.campaignName}Result`;
    const messageHandler = message => {
      messageCount += 1;
      var phone = JSON.parse(message.data.toString()).clientId.splice(0, 1);
      var lat = JSON.parse(message.data.toString()).latitude;
      var lon = JSON.parse(message.data.toString()).longitude;
      // if (job.event == event) {
      if (
        JSON.parse(message.data.toString()).event == event &&
        polyFunc(lat, lon, poly.polygon)
      ) {
        client.hincrby("example", `${phone}`, 2, (err, reply) => {
          if (reply > eventCriteria) {
            console.log(reply);
            let dataBuffer = Buffer.from(reply);
            pubsub
              .topic(resultTopic)
              .publisher()
              .publish(dataBuffer)
              .then(messageId => {
                console.log(`Message ${messageId} published:- ${reply}`);
              })
              .catch(err => {
                console.error("ERROR:", err);
              });

            bigquery
              .dataset("IotData")
              .table(`CampaignResults`)
              .insert({
                timastamp: Date.now() / 1000,
                clientId: phone,
                campaignId: campaign.campaignName
              });
          }
        });
      }
      message.ack();
    };
    subscription.on(`message`, messageHandler);
  });
}

function stopCampaign(subscriptionName, campaignDB, cb) {
  g.deleteSubscription(`${subscriptionName}`);
  campaignDB.findOneAndUpdate(
    { campaignName: `${campaign.campaignName}` },
    { isActive: false },
    (err, doc, res) => {
      if (err) {
        console.log(err);
        cb(false);
      } else {
        console.log("campaignStopped");
        cb(true);
      }
    }
  );
}

module.exports.createCampaign = createCampaign;
module.exports.serverStart = serverStart;
module.exports.stopCampaign = stopCampaign;

// console.log(`Received message ${message.id}:`);
// console.log(`\tData: ${message.data}`);
// console.log(`\tAttributes: ${message.attributes}`);
// console.log(Object.keys(message.attributes).deviceId);
// console.log(message.attributes.deviceId);
// console.log(message.attributes);
// console.log(JSON.parse(message.data.toString()).clientId);
