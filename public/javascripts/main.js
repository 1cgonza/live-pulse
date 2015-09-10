(function () {
  var ipAddress = 'ws://10.27.117.55:8000'; // NTUSECURE
  var socket = new WebSocket(ipAddress);

  var start    = document.getElementsByTagName('button')[0];
  var stop     = document.getElementsByTagName('button')[1];
  var controls = document.getElementById('controls');
  var options  = document.getElementById('options');

  var streaming = false;
  var loaded = false;
  var dataArray = [];
  var slicedArray = [];
  var v = 0;
  var layerCount = 0;
  var pulse, triangle, circle, horizontal, light;

  var stageW = window.innerWidth;
  var stageH = window.innerHeight;
  var centerX = stageW / 2;
  var centerY = stageH / 2;

  var icons = {
    pulseLine: '&#8275',
    trianglePulse: '&#9651',
    constellation: '&#9676',
    verticalGrid: '|||',
    lightShow: '&#9586'
  };

  function init() {
    pulse      = new Drawing('pulseLine');
    triangle   = new Drawing('trianglePulse');
    horizontal = new Drawing('verticalGrid');
    light      = new Drawing('lightShow');
    circle     = new Drawing('constellation');
    loaded     = true;
  }

  socket.onopen = function() {
    console.log('Socket opened sucessfully!');

    socket.onmessage = function (e) {
      if (streaming) {
        try {
          var data = JSON.parse(e.data);
          newBeat(data.raw);
        } catch (err) {
          console.error(err);
        }
      }
    };
  };

  function newBeat (data) {
    var mode = 'live';

    if (data.charAt(0) === 'S') {
      v = Number( data.substr(1) );
      dataArray.push(v);
      sliceArray();

      pulse.render();
      triangle.render();
      circle.render();
      horizontal.render();
      light.render();
    }
  }

  function sliceArray() {
    if ( dataArray.length <= stageW ) {
      slicedArray = dataArray;
    } else {
      var firstPoint = dataArray.length - stageW;
      var lastPoint =  dataArray.length;
      slicedArray =  dataArray.slice(firstPoint, lastPoint);
    }
  }

  function Drawing (viz) {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = stageW;
    this.canvas.height = stageH;
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = 0;
    this.canvas.style.left = 0;
    this.viz = viz;
    this.playing = true;
    this.opacity = 1;
    this.createBtn();
    this.ctx.fillStyle = 'rgba(255,255,255, 1)';
    document.body.appendChild(this.canvas);
  }

  Drawing.prototype.createBtn = function () {
    var btn = document.createElement('button');
    btn.innerHTML = icons[this.viz] || '&#8226';
    layerCount++;
    options.appendChild(btn);

    btn.addEventListener('click', function (event) {
      this.playing = !this.playing;
      if (this.playing) {
        event.target.className = '';
        this.opacity = 1;
        this.canvas.style.opacity = 1;
      } else {
        event.target.className = 'off';
      }
    }.bind(this), false);
  };

  Drawing.prototype.render = function () {
    if (this.playing) {
      this[this.viz]();
    }
    else if (this.opacity > 0) {
      this.opacity -= 0.01;
      this.canvas.style.opacity = this.opacity;
    }
  };

  Drawing.prototype.lightShow = function() {
    // console.log('lightshow');
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (var i = 0; i < slicedArray.length; i++) {
      var normal = 520 - v;
      var red = normal * 2 | 0;
      var green = slicedArray[i] / 5 | 0;
      var blue = slicedArray[i] / 3 | 0;

      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.moveTo(this.canvas.width, this.canvas.height);
      this.ctx.rotate(i * Math.PI/ 180);
      this.ctx.lineTo( (this.canvas.width - slicedArray[i] / 5), slicedArray[i] /4);
      this.ctx.lineTo( (this.canvas.width - slicedArray[i] / 3), slicedArray[i] /6);
      this.ctx.fillStyle = 'rgba(' + red + ',' + green + ',' + blue + ', 0.05)';
      this.ctx.fill();
      this.ctx.restore();
    }
  };

  Drawing.prototype.pulseLine = function() {
    this.ctx.clearRect(0, 0, stageW, stageH);

    for (var i = 0; i < slicedArray.length; i++) {
      var y = stageH - slicedArray[i] + 100;
      this.ctx.fillRect(i, y, 3, 3);
    }
  };

  Drawing.prototype.constellation = function() {
    this.ctx.save();
      this.ctx.translate(centerX, centerY);
      this.ctx.rotate(dataArray.length * Math.PI / 180);
      this.ctx.fillRect(0, (v * 5) - (stageW * 2), 2, 2);
    this.ctx.restore();
  };

  Drawing.prototype.trianglePulse = function() {
    var size  = v * 0.8;
    var red   = v / 2 | 0;
    var green = v / 3 | 0;
    var blue  = v / 4 | 0;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    this.ctx.translate( centerX, centerY );
    this.ctx.rotate(dataArray.length * Math.PI / 180);
    this.ctx.beginPath();
    this.ctx.moveTo( -(size / 2), (size / 2) );
    this.ctx.lineTo( (size / 2), (size / 2) );
    this.ctx.lineTo( 0, -(size / 2) );
    this.ctx.fillStyle = 'rgba(' + red + ',' + green + ',' + blue + ', 0.8)';
    this.ctx.fill();
    this.ctx.restore();
  };

  Drawing.prototype.verticalGrid = function() {
    var gap = 150;
    var columns = this.canvas.width / gap;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (var i = 0; i < columns; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo( (i * gap), 0 );
      this.ctx.lineTo( (i * gap), this.canvas.height );
      this.ctx.lineWidth = v * 2;
      this.ctx.strokeStyle = 'rgba(249,237,45, 0.1)';
      this.ctx.stroke();

    }
  };

  start.addEventListener('click', function () {
    if (!loaded) init();
    streaming = true;
    this.className = 'off';
    stop.className = '';
  }, false);

  stop.addEventListener('click', function () {
    this.className = 'off';
    start.className = '';
    streaming = false;
  }, false);

})();