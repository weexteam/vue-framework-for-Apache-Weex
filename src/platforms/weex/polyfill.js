var _global = global;

var setTimeout = _global.setTimeout;
var setTimeoutNative = _global.setTimeoutNative;

// fix no setTimeout on Android V8

if (typeof setTimeout === 'undefined' && typeof setTimeoutNative === 'function') {
  var timeoutMap = {};
  var timeoutId = 0;
  global.setTimeout = function (cb, time) {
    timeoutMap[++timeoutId] = cb;
    setTimeoutNative(timeoutId.toString(), time);
  };
  global.setTimeoutCallback = function (id) {
    if (typeof timeoutMap[id] === 'function') {
      timeoutMap[id]();
      delete timeoutMap[id];
    }
  };
}

var console = _global.console;

if (typeof console === 'undefined') {
  global.console = {
    log: function log() {
      if (typeof nativeLog === 'function') {
        nativeLog.apply(undefined, arguments);
      }
    },
    error: function error() {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      throw new Error(args);
    }
  };
}

Object.assign = function () {
  var args = Array.prototype.slice.call(arguments)
  var dest = args[0] || {}
  var srcList = args.slice(1)
  srcList.forEach(function (src) {
    for (var key in src) {
      dest[key] = src[key]
    }
  })
  return dest
}
