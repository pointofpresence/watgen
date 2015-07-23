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

        if (!source.start) {
            source.start = source.noteOn;
        }

        source.start(time);
    },

    start: function (playlist) {
        this.barTime = (60 / this.bpm) * 4;
        this.eighthNoteTime = this.barTime / 8;
        this.sixteenNoteTime = this.barTime / 16;
        this.startTime = this.context.currentTime + 0.100;

        playlist.forEach((function (a) {
            this.playSound(
                this.BUFFERS[a[0]],
                this.startTime + a[1] * this.barTime + a[2] * this.sixteenNoteTime
            );
        }).bind(this));
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
        ["kick", 0, 0],
        ["kick", 2, 0],
        ["bass", 0, 0],
        ["crash", 1, 12],
        ["ts404", 4, 0]
    ];

    if (sequencer.init()) {
        sequencer.loadBuffers(BUFFERS_TO_LOAD);

        $("#start").on("click", function () {
            sequencer.start(playlist);
        })
    }
});

