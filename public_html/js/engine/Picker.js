LEEWGL.Picker = function () {
    this.frameBuffer = new LEEWGL.FrameBuffer();

    var _width, _height = 0;

    this.lastCapturedColorMap = [];
    this.objList = {};

    this.initPicking = function (gl, width, height) {
        _width = width;
        _height = height;
        
        this.lastCapturedColorMap = new Uint8Array(_width * _height * 4);

        gl.enable(gl.DEPTH_TEST);

        this.frameBuffer.init(gl, width, height);
        this.frameBuffer.bind(gl);

        var texture = new LEEWGL.Texture();
        texture.create(gl);
        texture.bind(gl);
        texture.setParameteri(gl, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        texture.setParameteri(gl, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        texture.generateMipmap(gl);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        var depthBuffer = new LEEWGL.RenderBuffer();
        depthBuffer.create(gl);
        depthBuffer.bind(gl);

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture.webglTexture, 0);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, _width, _height);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer.getBuffer());

        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            alert("this combination of attachments does not work");
            return;
        }

        texture.unbind(gl);
        depthBuffer.unbind(gl);
        this.frameBuffer.unbind(gl);
    };

    this.pick = function (gl, x, y) {
        this.frameBuffer.bind(gl);

        gl.readPixels(0, 0, _width, _height, gl.RGBA, gl.UNSIGNED_BYTE, this.lastCapturedColorMap);

        var color = this.getColorMapColor(x, y);
        var index = color[0] * 65536 + color[1] * 256 + color[2];

        if (this.objList[index]) {
            this.frameBuffer.unbind(gl);
            return this.objList[index];
        } else {
            return null;
        }
    };
    
    this.addToList = function(index, obj) {
        this.objList[index] = obj;
    };
    
    this.getColorMapColor = function (x, y) {
        if (x >= _width || y >= _height || x < 0 || y < 0) {
            console.error('LEEWGL: Invalid color map pixel position');
            return;
        }
        if (!this.lastCapturedColorMap) {
            console.error('LEEWGL: Color map not captured');
            return;
        }
        var position = (_height - 1 - y) * _width * 4 + x * 4;
        return [this.lastCapturedColorMap[position],
            this.lastCapturedColorMap[position + 1],
            this.lastCapturedColorMap[position + 2]];
    };
    
    this.bind = function(gl) {
        this.frameBuffer.bind(gl);
    };
    
    this.unbind = function(gl) {
        this.frameBuffer.unbind(gl);
    };
};
