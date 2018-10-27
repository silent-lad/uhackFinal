function pointInPolygon(latitude, longitude, poly) {
  var polygon = JSON.stringify(poly.polygon);

  var vertx = [];
  var verty = [];
  var nvert = 0;
  var testx = longitude;
  var testy = latitude;

  for (coord in polygon) {
    vertx[nvert] = polygon[coord][0];
    verty[nvert] = polygon[coord][1];
    nvert++;
  }
  var i,
    j,
    c = 0;
  for (i = 0, j = nvert - 1; i < nvert; j = i++) {
    if (
      verty[i] > testy != verty[j] > testy &&
      testx <
        ((vertx[j] - vertx[i]) * (testy - verty[i])) / (verty[j] - verty[i]) +
          vertx[i]
    ) {
      c = !c;
    }
  }
  return c;
}

module.exports = pointInPolygon;
