var strftime = require('strftime');

// https://github.com/winstonjs/winston/issues/802

var winston = require('winston');

winston.remove(winston.transports.Console);     // remove the default options
winston.add(new winston.transports.Console(), {       // and substitute these
  timestamp: function () { return strftime('%F %T.%L'); },
  formatter: function (options) { // Return string will be passed to winston.
    return options.timestamp() + ' ' + options.level.toUpperCase() + " " + options.message ;
  }
});
// add more Winston options if desired

