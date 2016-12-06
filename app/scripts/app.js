/**
 * Created by michal.baranowski on 04.12.2016.
 */

var mockConfig = {
  a: 5,
  b: 4.5,
  h: 1.5,
  ro1: 20,
  ro2: 9999999
};

var chartCount = 0;


var App = function (config) {

  this.config = config || mockConfig;

  //Initialize properties
  this.a = this.config.a; //promień kuli
  this.b = this.config.b; //odległóść pomiędzy elektrodami - układ Wenera
  this.h = this.config.h; //głębokość na której znajduje się kula liczona od górnej krawędzi kuli
  this.ro1 = this.config.ro1; //Oporność ośrodka
  this.ro2 = this.config.ro2; //Oporność kuli

  this.VAM = null;
  this.VAN = null;
  this.VBM = null;
  this.VBN = null;

  this.R = math.matrix(math.zeros(66, 4));
  this.T = math.matrix(math.zeros(66, 4));
  this.P = math.matrix(math.zeros(100, 4));
  this.B = math.matrix(math.zeros(100, 4));
  this.rho = math.matrix(math.zeros(66));

  this.processData();
};

App.prototype = function () {

  var processData = function () {

    for (var i = 0; i < 67; i++) {

      this.R.set([i, 0], Math.sqrt(Math.pow((((1.5 * i) - (3 * this.b) / 2) - 50), 2) + Math.pow(this.h + this.a, 2))); //RA - d
      this.R.set([i, 1], Math.sqrt(Math.pow(((1.5 * i) - (this.b / 2) - 50), 2) + Math.pow(this.h + this.a, 2))); //RM
      this.R.set([i, 2], Math.sqrt(Math.pow((1.5 * i + (this.b / 2) - 50), 2) + Math.pow(this.h + this.a, 2))); //RN
      this.R.set([i, 3], Math.sqrt(Math.pow((1.5 * i + (3 * this.b / 2) - 50), 2) + Math.pow(this.h + this.a, 2))); //RB
      this.T.set([i, 0], Math.acos((Math.pow(this.b, 2) - Math.pow(this.R.get([i, 0]), 2) - Math.pow(this.R.get([i, 1]), 2)) / (-2 * this.R.get([i, 0]) * this.R.get([i, 1]))));
      this.T.set([i, 1], Math.acos((Math.pow(2 * this.b, 2) - Math.pow(this.R.get([i, 0]), 2) - Math.pow(this.R.get([i, 2]), 2)) / (-2 * this.R.get([i, 0]) * this.R.get([i, 2]))));
      this.T.set([i, 2], Math.acos((Math.pow(2 * this.b, 2) - Math.pow(this.R.get([i, 3]), 2) - Math.pow(this.R.get([i, 1]), 2)) / (-2 * this.R.get([i, 3]) * this.R.get([i, 1]))));
      this.T.set([i, 3], Math.acos((Math.pow(this.b, 2) - Math.pow(this.R.get([i, 3]), 2) - Math.pow(this.R.get([i, 2]), 2)) / (-2 * this.R.get([i, 3]) * this.R.get([i, 2]))));
    }

    for (var j = 0; j < 67; j++) {

      this.P.set([1, 0], 1);
      this.P.set([2, 0], Math.cos(this.T.get([j, 0])));

      this.P.set([1, 1], 1);
      this.P.set([2, 1], Math.cos(this.T.get([j, 1])));

      this.P.set([1, 2], 1);
      this.P.set([2, 2], Math.cos(this.T.get([j, 2])));

      this.P.set([1, 3], 1);
      this.P.set([2, 3], Math.cos(this.T.get([j, 3])));

      for (var k = 2; k < 100; k++) {
        this.P.set([k + 1, 0], ((2.0 * k + 1) / (k + 1)) * this.P.get([k, 0]) * Math.cos(this.T.get([j, 1])) - this.P.get([k - 1, 0]) * ((k) / (k + 1)));
        this.P.set([k + 1, 1], ((2.0 * k + 1) / (k + 1)) * this.P.get([k, 1]) * Math.cos(this.T.get([j, 1])) - this.P.get([k - 1, 1]) * ((k) / (k + 1)));
        this.P.set([k + 1, 2], ((2.0 * k + 1) / (k + 1)) * this.P.get([k, 2]) * Math.cos(this.T.get([j, 1])) - this.P.get([k - 1, 2]) * ((k) / (k + 1)));
        this.P.set([k + 1, 3], ((2.0 * k + 1) / (k + 1)) * this.P.get([k, 3]) * Math.cos(this.T.get([j, 1])) - this.P.get([k - 1, 3]) * ((k) / (k + 1)));
      }

      for (var l = 1; l < 100; l++) {
        this.B.set([l, 0], 1 * this.ro1 / (2 * Math.PI) * l * (1 - this.ro1 / this.ro2) / (l * this.ro1 / this.ro2 + (l + 1)) * Math.pow(this.a, 2 * l + 1) / (Math.pow(this.R.get([j, 0]), l + 1)));
        this.B.set([l, 1], 1 * this.ro1 / (2 * Math.PI) * l * (1 - this.ro1 / this.ro2) / (l * this.ro1 / this.ro2 + (l + 1)) * Math.pow(this.a, 2 * l + 1) / (Math.pow(this.R.get([j, 3]), l + 1)));
      }

      for (var m = 1; m < 100; m++) {
        this.VAM = this.VAM + this.B.get([m, 0]) * Math.pow(this.R.get([j, 1]), -1 * m - 1) * this.P.get([m, 0]);
        this.VAN = this.VAN - this.B.get([m, 0]) * Math.pow(this.R.get([j, 2]), -1 * m - 1) * this.P.get([m, 1]);
        this.VBM = this.VBM + this.B.get([m, 1]) * Math.pow(this.R.get([j, 1]), -1 * m - 1) * this.P.get([m, 2]);
        this.VBN = this.VBN - this.B.get([m, 1]) * Math.pow(this.R.get([j, 2]), -1 * m - 1) * this.P.get([m, 3]);
      }

      this.rho.set([j], (2 * Math.PI * this.b * ((this.VAM - this.VBN - this.VAN + this.VBM + 1 * this.ro1) / (2 * Math.PI * this.b))) / 1);

      //  console.log(j, this.rho.get[j]);

    }

    //   console.log(this.rho);
  };

  var presentData = function () {
    var data = [];

    for (var i = 0; i < 67; i++) {
      data[i] = {
        x: -50 + 1.5 * i,
        y: this.rho.get([i])
      };
    }
    return data;
  };


  return {
    processData: processData,
    presentData: presentData
  }

}();

var drawChart = function (data) {
  chartCount++;

  var canvas = document.createElement('canvas');
  canvas.id = "myChart" + chartCount;
  canvas.width = 400;
  canvas.height = 400;
  document.getElementById("charts").appendChild(canvas);

  var ctx = document.getElementById("myChart" + chartCount).getContext("2d");

  return new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [{
        label: 'Chart ' + chartCount,
        data: data,
        fill: false
      }]
    },
    options: {
      scales: {
        xAxes: [{
          type: 'linear',
          position: 'bottom'
        }],
        yAxes: [{
          ticks: {
            max: Math.max.apply(null, Object.keys(data).map(function (key) {
              return data[key].y;
            })) + 1,
            min: Math.min.apply(null, Object.keys(data).map(function (key) {
              return data[key].y;
            })) - 1
          }
        }]
      }
    }
  });

};

var calculate = function () {

  var config = {},
    radius = parseInt(document.getElementById("radius").value),
    distance = parseInt(document.getElementById("distance").value),
    depth = parseInt(document.getElementById("depth").value),
    environResist = parseInt(document.getElementById("environResist").value),
    ballResist = parseInt(document.getElementById("ballResist").value),
    app;

  config.a = radius;
  config.b = distance;
  config.h = depth;
  config.ro1 = environResist;
  config.ro2 = ballResist;

  app = new App(config);
  drawChart(app.presentData());
};
