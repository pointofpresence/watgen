function BufferLoader(context, urlList, callback) {
    this.context = context;
    this.urlList = urlList;
    this.onload = callback;
    this.bufferList = [];
    this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function (url, index) {
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";
    var loader = this;

    request.onload = function () {
        loader.context.decodeAudioData(
            request.response,

            function (buffer) {
                if (!buffer) {
                    console.error("Decoding file data: " + url);
                    return;
                }

                loader.bufferList[index] = buffer;

                if (++loader.loadCount == loader.urlList.length) {
                    loader.onload(loader.bufferList);
                }
            },

            function (error) {
                console.error("decodeAudioData error", error);
            }
        );
    };

    request.onerror = function () {
        console.error("BufferLoader: XHR error");
    };

    request.send();
};

BufferLoader.prototype.load = function () {
    for (var i = 0; i < this.urlList.length; ++i) {
        this.loadBuffer(this.urlList[i], i);
    }
};

var sequencer = {
    BUFFERS: {},
    bpm:     130,

    init: function () {
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.context = new AudioContext();
        } catch (e) {
            alert("Web Audio API is not supported in this browser");
            return false;
        }

        this.eighthNoteTime = (60 / this.bpm) / 2;

        return true;
    },

    loadBuffers: function (buffers) {
        var names = [];
        var paths = [];

        for (var name in buffers) {
            if (!buffers.hasOwnProperty(name)) {
                continue
            }

            var path = buffers[name];
            names.push(name);
            paths.push(path);
        }

        var bufferLoader = new BufferLoader(this.context, paths, (function (bufferList) {
            for (var i = 0; i < bufferList.length; i++) {
                var buffer = bufferList[i];
                var name = names[i];
                this.BUFFERS[name] = buffer;
            }
        }).bind(this));

        bufferLoader.load();
    },

    playSound: function (buffer, time) {
        var source = this.context.createBufferSource();
        source.buffer = buffer;
        source.connect(this.context.destination);
        if (!source.start)
            source.start = source.noteOn;
        source.start(time);
    },

    start: function () {
        this.startTime = this.context.currentTime + 0.100;

        for (var i = 0; i < 24; i++) {
            this.playSound(this.BUFFERS.kick, this.startTime + i * 8 * this.eighthNoteTime);
        }

        for (i = 4; i < 32; i += 4) {
            this.playSound(this.BUFFERS.bass, this.startTime + i * 8 * this.eighthNoteTime);
        }

        for (i = 8; i < 32; i += 4) {
            this.playSound(this.BUFFERS.melody, this.startTime + i * 8 * this.eighthNoteTime);
        }

        for (i = 12; i < 32; i += 4) {
            this.playSound(this.BUFFERS.guitar, this.startTime + i * 8 * this.eighthNoteTime);
        }

        for (i = 16; i < 32; i += 4) {
            this.playSound(this.BUFFERS.guitar2, this.startTime + i * 8 * this.eighthNoteTime);
        }

        for (i = 16; i < 32; i += 4) {
            this.playSound(this.BUFFERS.ts404, this.startTime + i * 8 * this.eighthNoteTime);
        }

        for (i = 0; i < 33; i += 8) {
            this.playSound(this.BUFFERS.crash, this.startTime + i * 8 * this.eighthNoteTime);
        }
    }
};

$(function () {
    var BUFFERS_TO_LOAD = {
        kick:    '/loop.wav',
        bass:    '/bass.wav',
        melody:  '/melody.wav',
        guitar:  '/guitar.wav',
        guitar2: '/guitar2.wav',
        ts404:   '/404.wav',
        crash:   '/crash.wav'
    };

    var playlist = [
        ["kick", 0]
    ];

    if (sequencer.init()) {
        sequencer.loadBuffers(BUFFERS_TO_LOAD);

        $("#start").on("click", function () {
            sequencer.start();
        })
    }
});

