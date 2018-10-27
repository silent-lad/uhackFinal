const BigQuery = require("@google-cloud/bigquery");
const fs = require("file-system");

function syncQuery(event, eventCriteria, cityName, timeEnd, timeStart, cb) {
  var poly = require(`./polygons/${cityName}.json`);
  const projectId = "naughty-intern-1337";
  if (cityName == null) {
    var sqlQuery = `
        SELECT * 
        FROM (
                SELECT clientId,count(*) as cnt
                FROM \`naughty-intern-1337.IotData.IotDataTable\`
                WHERE (time BETWEEN "${timeStart} AND TIMESTAMP"${timeEnd}")
                AND event = "${event}"
                -- LIMIT 100 
                GROUP BY clientId
                ORDER BY cnt DESC
            )
        WHERE cnt>${eventCriteria}`;
  } else {
    var sqlQuery = `CREATE TEMPORARY FUNCTION pointInPolygon(latitude FLOAT64, longitude FLOAT64) RETURNS BOOL LANGUAGE js AS """ 
    var polygon= ${JSON.stringify(poly.polygon)};
    
      var vertx = [];
      var verty = [];
      var nvert = 0;
      var testx = longitude;
      var testy = latitude;
    
      for(coord in polygon){
        vertx[nvert] = polygon[coord][0];
        verty[nvert] = polygon[coord][1];
        nvert ++;
      }
      var i, j, c = 0;
      for (i = 0, j = nvert-1; i < nvert; j = i++) {
        if ( ((verty[i]>testy) != (verty[j]>testy)) &&(testx < (vertx[j]-vertx[i]) * (testy-verty[i]) / (verty[j]-verty[i]) + vertx[i]) ){
          c = !c;
        }
      }
      return c;
    """;
    
    SELECT * FROM (SELECT clientId,count(*) as cnt
    FROM \`naughty-intern-1337.IotData.IotDataTable\`
    WHERE pointInPolygon(latitude, longitude) = TRUE
    AND (time BETWEEN "${timeStart} AND TIMESTAMP"${timeEnd}")
    AND event = "${event}"
    -- LIMIT 100 
    GROUP BY clientId
    ORDER BY cnt DESC) WHERE cnt>${eventCriteria}`;
  }

  //   var polygon = JSON.parse(poly).polygon;

  // Creates a client
  const bigquery = new BigQuery({
    projectId: projectId
  });

  console.log(sqlQuery);

  const options = {
    query: sqlQuery,
    timeoutMs: 10000, // Time out after 10 seconds.
    useLegacySql: false // Use standard SQL syntax for queries.
  };

  bigquery
    .query(options)
    .then(results => {
      //   if (results[0][0] == null) {
      //     console.log("Empty");
      //   } else {
      console.table(results[0]);
      cb(results[0]);

      //   results[0].forEach(el => {
      //     console.log(el.clientId);
      //   });
      //   }
    })
    .catch(err => {
      console.error("ERROR:", err);
      cb("ERROR");
    });
}

module.exports.query = syncQuery;
