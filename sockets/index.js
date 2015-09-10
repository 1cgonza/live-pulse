var serialport = require('serialport');

var live_pulse = function (ws) {
  ws.on('connection', function (socket) {
    console.log('new user');
    openSerialPort(socket);
  });
};

function openSerialPort (socket) {
  var sp = new serialport.SerialPort('/dev/cu.usbmodem1411', {
    baudrate: 115200,
    parser: serialport.parsers.readline('\n')
  });

  sp.on('open', function (error) {
    if (error) {
      console.log('Failed to open serial port', error);
    } else {
      console.log('Opened serial port');
      this.on( 'data', streamData );
    }
  });

  function streamData (data) {
    /**
     * The pulse data is coded in the following way:
    * S = raw data
    * B = BPM (Beat per Minute)
    * Q = TBB (Time between beats)
    **/
    if ( data.charAt(0) === 'S') {
      var raw = JSON.stringify({raw: data});
      socket.send(raw);
    }
  }
}

/**
 * List the available ports in the computer.
 * Useful for debugging and to select the right port name to use with the serialport library.
 * USAGE: Uncomment the line below to log the ports
 */
// console.log( listPorts() );
function listPorts () {
  serialport.list(function (err, ports) {
    console.log(':::::::::::    PORTS LIST    :::::::::::');

    ports.forEach(function (port) {
      console.log(
        '\n...............',
        '\n| Path: ' + port.comName,
        port.manufacturer.length > 0 ? '\n| Manufacturer: ' + port.manufacturer : '',
        port.serialNumber.length > 0 ? '\n| Serial Number: ' + port.serialNumber : '',
        '\n...............'
      );
    });

    console.log('-------------------------------------------------');
  });
}

module.exports = live_pulse;