/**
 * Lightweight Editor Environment WebGL
 * @namespace
 * @type {Object}
 */
var LEEWGL = {
  version: '0.8'
};

/** @global */
LEEWGL.ROOT = '';

/** @global */
LEEWGL.REQUIRES = ['Core'];

/// node.js compatibility
if (typeof module === 'object') {
  module.exports = LEEWGL;
}

// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent.button
/** @global */
LEEWGL.MOUSE = {
  LEFT: 0,
  MIDDLE: 1,
  RIGHT: 2
};

/** @global */
LEEWGL.KEYS = {};
LEEWGL.KEYS.PAGE_UP = 33;
LEEWGL.KEYS.PAGE_DOWN = 34;
LEEWGL.KEYS.LEFT_CURSOR = 37;
LEEWGL.KEYS.UP_CURSOR = 38;
LEEWGL.KEYS.RIGHT_CURSOR = 39;
LEEWGL.KEYS.DOWN_CURSOR = 40;
LEEWGL.KEYS.A = 65;
LEEWGL.KEYS.D = 68;
LEEWGL.KEYS.S = 83;
LEEWGL.KEYS.W = 87;
LEEWGL.KEYS.ENTER = 13;
LEEWGL.KEYS.ESC = 27;
LEEWGL.KEYS.F5 = 116;

/** @global */
LEEWGL.TEXTURE = {};

// wrapping modes
LEEWGL.TEXTURE.WRAPPING_REPEAT = 1000;
LEEWGL.TEXTURE.WRAPPING_CLAMP_TO_EDGE = 1001;
LEEWGL.TEXTURE.WRAPPING_MIRRORED_REPEAT = 1002;

// filters
LEEWGL.TEXTURE.FILTER_NEAREST = 1003;
LEEWGL.TEXTURE.FILTER_NEAREST_MIPMAP_NEAREST = 1004;
LEEWGL.TEXTURE.FILTER_NEAREST_MIPMAP_LINEAR = 1005;
LEEWGL.TEXTURE.FILTER_LINEAR = 1006;
LEEWGL.TEXTURE.FILTER_LINEAR_MIPMAP_NEAREST = 1007;
LEEWGL.TEXTURE.FILTER_LINEAR_MIPMAP_LINEAR = 1008;

LEEWGL.TEXTURE.IMG_DEFAULT = undefined;
LEEWGL.TEXTURE.MAPPING_DEFAULT = undefined;

// data types
/** @global */
LEEWGL.TYPE = {};
LEEWGL.TYPE.UNSIGNED_BYTE = 1009;
LEEWGL.TYPE.BYTE = 1010;
LEEWGL.TYPE.SHORT = 1011;
LEEWGL.TYPE.UNSIGNED_SHORT = 1012;
LEEWGL.TYPE.INT = 1013;
LEEWGL.TYPE.UNSIGNED_INT = 1014;
LEEWGL.TYPE.FLOAT = 1015;

// pixel formats
/** @global */
LEEWGL.FORMAT = {};
LEEWGL.FORMAT.ALPHA = 1016;
LEEWGL.FORMAT.RGB = 1017;
LEEWGL.FORMAT.RGBA = 1018;
LEEWGL.FORMAT.LUMINANCE = 1019;
LEEWGL.FORMAT.LUMINANCE_ALPHA = 1020;

/** @global */
LEEWGL.ENGINE = {};
LEEWGL.ENGINE.LIGHTS = ['Directional', 'Spot', 'Point'];

/** @global */
LEEWGL.EDITOR = {};

/** @global */
LEEWGL.EDITOR.RENDERING = {};
LEEWGL.EDITOR.RENDERING.SHADOW = true;
LEEWGL.EDITOR.RENDERING.DEPTH_BUFFER = true;
LEEWGL.EDITOR.RENDERING.BLENDING = true;
LEEWGL.EDITOR.RENDERING.CULLING = 'front';

LEEWGL.EDITOR.PICKING = true;

/** @global */
LEEWGL.EDITOR.TRANSFORMATION = {};
LEEWGL.EDITOR.TRANSFORMATION.TRANSLATE = 'translation';
LEEWGL.EDITOR.TRANSFORMATION.ROTATE = 'rotation';
LEEWGL.EDITOR.TRANSFORMATION.SCALE = 'scale';

/** @global */
LEEWGL.VECTOR = {};
LEEWGL.VECTOR2D = {};
LEEWGL.VECTOR2D.UP = [0.0, 1.0];
LEEWGL.VECTOR3D = {};
LEEWGL.VECTOR3D.UP = [0.0, 1.0, 0.0];


/**
 * @constructor
 * @param  {bool} auto
 */
LEEWGL.Timer = function(auto) {
  this.auto = auto !== undefined ? auto : true;

  this.startTime = 0;
  this.oldTime = 0;
  this.elapsedTime = 0;

  this.running = false;
};

LEEWGL.Timer.prototype = {
  constructor: LEEWGL.Timer,
  start: function() {
    this.startTime = self.performance !== undefined && self.performance.now !== undefined ? self.performance.now() : Date.now();
    this.oldTime = this.startTime;
    this.running = true;
  },
  restart: function() {
    this.reset();
    this.start();
  },
  stop: function() {
    this.running = false;
    return this.getElapsedTime();
  },
  getElapsedTime: function() {
    this.getDeltaTime();
    return this.elapsedTime;
  },
  getDeltaTime: function() {
    if (this.auto && this.running === false)
      this.start();

    var diff = 0;

    if (this.running === true) {
      var newTime = self.performance !== undefined && self.performance.now !== undefined ? self.performance.now() : Date.now();
      diff = (newTime - this.oldTime);
      this.oldTime = newTime;
      this.elapsedTime += diff;
    }

    return diff;
  },
  reset: function() {
    this.startTime = 0;
    this.oldTime = 0;
    this.elapsedTime = 0;
    this.running = false;
  }
};

/**
 * @constructor
 * @param  {DOMElement} options.canvas
 * @param  {webGLContext} options.context
 */
LEEWGL.Core = function(options) {
  this.options = {
    'canvas': document.createElement('canvas'),
    'context': null
  };

  extend(LEEWGL.Core.prototype, LEEWGL.Options.prototype);

  this.setOptions(options);

  var _canvas = this.options.canvas;
  var _context = this.options.context;
  var _app = null;

  this.canvas = _canvas;
  this.context = null;
  this.timer = new LEEWGL.Timer();

  this.initTime = 0;

  var _this = this,
    _programs = [],
    _currentProgram = null,
    _currentFramebuffer = null,
    _currentCamera = null,
    _viewportX = 0,
    _viewportY = 0,
    _viewportWidth = _canvas.width,
    _viewportHeight = _canvas.height,
    _quit = false;

  var _gl = null;

  try {
    _gl = _context || _canvas.getContext('webgl') || _canvas.getContext('experimental-webgl');
    if (_gl === null) {
      if (_canvas.getContext('webgl') === null) {
        throw 'Error creating WebGL context with selected attributes.';
      } else {
        throw 'Error creating WebGL context.';
      }
    }
  } catch (error) {
    console.error(error);
  }

  this.context = _gl;

  this.getContext = function() {
    return _gl;
  };

  this.getCanvas = function() {
    return _canvas;
  };

  this.setSize = function(width, height, updateStyle) {
    updateStyle = (typeof updateStyle !== 'undefined') ? updateStyle : true;

    _canvas.width = width;
    _canvas.height = height;

    if (updateStyle === true) {
      _canvas.style.width = width + 'px';
      _canvas.style.height = height + 'px';
    }
  };

  this.getRenderSize = function() {
    return {
      'width': _canvas.width,
      'height': _canvas.height
    };
  };

  this.setViewport = function(x, y, width, height) {
    _viewportX = x;
    _viewportY = y;
    _viewportWidth = width;
    _viewportHeight = height;

    SETTINGS.set('viewport', {
      'x': x,
      'y': y,
      'width': width,
      'height': height
    });

    _gl.viewport(_viewportX, _viewportY, _viewportWidth, _viewportHeight);
  };

  this.attachApp = function(app) {
    _app = app;
  };

  this.paramToGL = function(param) {
    if (param === LEEWGL.TypeUnsignedByte)
      return _gl.UNSIGNED_BYTE;
    if (param === LEEWGL.TypeByte)
      return _gl.BYTE;
    if (param === LEEWGL.TypeShort)
      return _gl.SHORT;
    if (param === LEEWGL.TypeUnsignedShort)
      return _gl.UNSIGNED_SHORT;
    if (param === LEEWGL.TypeInt)
      return _gl.INT;
    if (param === LEEWGL.TypeUnsignedInt)
      return _gl.UNSIGNED_INT;
    if (param === LEEWGL.TypeFloat)
      return _gl.FLOAT;

    if (param === LEEWGL.FormatAlpha)
      return _gl.ALPHA;
    if (param === LEEWGL.FormatRGB)
      return _gl.RGB;
    if (param === LEEWGL.FormatRGBA)
      return _gl.RGBA;
    if (param === LEEWGL.FormatLuminance)
      return _gl.LUMINANCE;
    if (param === LEEWGL.FormatLuminanceAlpha)
      return _gl.LUMINANCE_ALPHA;
  };

  this.initMouse = function() {
    if (_app === null) {
      console.error("LEEWGL.Core initMouse: No app attached.");
      return null;
    }

    _canvas.onmousedown = _app.onMouseDown.bind(_app);
    _canvas.oncontextmenu = _app.onMouseDown.bind(_app);
    _canvas.onmouseup = _app.onMouseUp.bind(_app);
    _canvas.onmousemove = _app.onMouseMove.bind(_app);
    _canvas.onkeydown = _app.onKeyDown.bind(_app);
    _canvas.onkeyup = _app.onKeyUp.bind(_app);
  };

  this.init = function() {
    this.initMouse();

    if (_app !== null)
      _app.onCreate();

    _this.timer.start();
  };

  this.run = function() {
    window.requestAnimationFrame(_this.run);

    var dt = (1000 / SETTINGS.get('fps'));

    if (dt > _this.timer.getElapsedTime()) {
      if (_app !== null)
        _app.onUpdate(dt);
      return;
    }

    if (_app !== null)
      _app.onRender();

    _this.timer.restart();
  };
};
