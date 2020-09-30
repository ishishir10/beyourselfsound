if ("undefined" == typeof jQuery)
    throw new Error(
        "trackswitchjs's JavaScript requires jQuery. jQuery must be included before trackswitchjs's JavaScript."
    );
+(function (a) {
    var b = a.fn.jquery.split(" ")[0].split(".");
    if (
        (b[0] < 2 && b[1] < 9) ||
        (1 == b[0] && 9 == b[1] && b[2] < 1) ||
        b[0] >= 4
    )
        throw new Error(
            "trackswitchjs's JavaScript requires at least jQuery v1.9.1 but less than v4.0.0"
        );
})(jQuery),
    (function () {
        function a(a, e) {
            (this.element = $(a)),
                (this.options = $.extend({}, d, e)),
                this.options.mute ||
                this.options.solo ||
                (console.error(
                    "Cannot disable both solo and mute, reactivating solo"
                ),
                    (this.options.solo = !0)),
                this.options.onlyradiosolo &&
                ((this.options.mute = !1), (this.options.radiosolo = !0)),
                (this._defaults = d),
                (this._name = c),
                (this.numberOfTracks = 0),
                (this.longestDuration = 0),
                (this.playing = !1),
                (this.repeat = this.options.repeat),
                this.startTime,
                (this.position = 0),
                this.timerUpdateUI,
                (this.currentlySeeking = !1),
                this.seekingElement,
                (this.trackProperties = Array()),
                (this.trackSources = Array()),
                (this.trackGainNode = Array()),
                (this.trackBuffer = Array()),
                (this.activeAudioSources = Array()),
                b &&
                ((this.gainNodeMaster = b.createGain()),
                    (this.gainNodeMaster.gain.value = 0),
                    this.gainNodeMaster.connect(b.destination)),
                this.init();
        }
        var b = (function () {
            return "undefined" != typeof AudioContext
                ? new AudioContext()
                : "undefined" != typeof webkitAudioContext
                    ? new webkitAudioContext()
                    : "undefined" != typeof mozAudioContext
                        ? new mozAudioContext()
                        : null;
        })(),
            c =
                (document.registerElement("ts-track"),
                    document.registerElement("ts-source"),
                    "trackSwitch"),
            d = {
                mute: !0,
                solo: !0,
                globalsolo: !0,
                repeat: !1,
                radiosolo: !1,
                onlyradiosolo: !1,
                spacebar: !1,
                tabview: !1,
            };
        (a.prototype.init = function () {
            var a = this;
            this.element.addClass("jquery-trackswitch"),
                0 === this.element.find(".main-control").length &&
                this.element.prepend(
                    '<div class="overlay"><span class="activate">Activate</span><p id="overlaytext"></p><p id="overlayinfo"><span class="info">Info</span><span class="text"><strong>trackswitch.js</strong> - open source multitrack audio player<br /><a href="https://github.com/audiolabs/trackswitch.js">https://github.com/audiolabs/trackswitch.js</a></span></p></div><div class="main-control"><ul class="control"><li class="stop button">Stop</li><li class="playpause button">Play</li><li class="title"><img class="jsicon" src="https://static.wixstatic.com/media/2a5dd0_22bf2b34d1f444c8937697a304bdac55~mv2.png"><p class="tname">Drop Elevation</p></li><li class="seekwrap"><div class="seekbar"><div class="seekhead"></div></div></li></ul></div>'
                ),
                this.element.find(".seekable:not(.seekable-img-wrap > .seekable)")
                    .length > 0 && this.element.find(".main-control .seekwrap").hide(),
                this.element
                    .find(".seekable:not(.seekable-img-wrap > .seekable)")
                    .each(function () {
                        (a.originalImage = this.src),
                            $(this).wrap(
                                '<div class="seekable-img-wrap" style="' +
                                $(this).data("style") +
                                '; display: block;"></div>'
                            ),
                            $(this).after(
                                '<div class="seekwrap" style=" left: ' +
                                ($(this).data("seekMarginLeft") || 0) +
                                "%; right: " +
                                ($(this).data("seekMarginRight") || 0) +
                                '%;"><div class="seekhead"></div></div>'
                            );
                    }),
                this.element.on(
                    "touchstart mousedown",
                    ".overlay .activate",
                    $.proxy(this.load, this)
                ),
                this.element.on(
                    "touchstart mousedown",
                    ".overlay #overlayinfo .info",
                    $.proxy(function () {
                        this.element.find(".overlay .info").hide(),
                            this.element.find(".overlay .text").show();
                    }, this)
                ),
                this.element.one("loaded", $.proxy(this.loaded, this)),
                this.element.one("errored", $.proxy(this.errored, this));
            var c = $('<ul class="track_list"></ul>');
            if (
                ((this.numberOfTracks = this.element.find("ts-track").length),
                    this.numberOfTracks > 0)
            ) {
                if (
                    (this.element.find("ts-track").each(function (b) {
                        a.trackProperties[b] = {
                            mute: !1,
                            solo: !1,
                            success: !1,
                            error: !1,
                        };
                        var d = a.options.tabview ? " tabs" : "",
                            e = a.options.radiosolo ? " radio" : "",
                            f = a.options.onlyradiosolo ? " solo" : "";
                        c.append(
                            '<li class="track' +
                            d +
                            f +
                            '" style="' +
                            ($(this).attr("style") || "") +
                            '">' +
                            ($(this).attr("title") || "Track " + (b + 1)) +
                            '<ul class="control">' +
                            (a.options.solo
                                ? '<li class="solo button' + e + '" title="Solo">Solo</li>'
                                : "") +
                            "</ul></li>"
                        );
                    }),
                        this.element.append(c),
                        this.options.radiosolo &&
                        ((this.trackProperties[0].solo = !0),
                            this.apply_track_properties()),
                        this.updateMainControls(),
                        !b)
                )
                    return (
                        this.element.trigger("errored"),
                        this.element
                            .find("#overlaytext")
                            .html(
                                "Web Audio API is not supported in your browser. Please consider upgrading."
                            ),
                        !1
                    );
            } else this.element.trigger("errored");
        }),
            (a.prototype.destroy = function () {
                this.element.find(".main-control").remove(),
                    this.element.find(".tracks").remove(),
                    this.element.removeData();
            }),
            (a.prototype.sourceFailed = function (a, b, c) {
                void 0 !== this.trackSources[a][b + 1]
                    ? this.prepareRequest(a, b + 1)
                    : ((this.trackProperties[a].error = !0), this.trackStatusChanged());
            }),
            (a.prototype.decodeAudio = function (a, c, d) {
                var e = this,
                    f = a.response;
                b.decodeAudioData(
                    f,
                    function (a) {
                        (e.trackGainNode[c] = b.createGain()),
                            e.trackGainNode[c].connect(e.gainNodeMaster),
                            (e.trackBuffer[c] = b.createBufferSource()),
                            (e.trackBuffer[c].buffer = a),
                            (e.trackProperties[c].success = !0),
                            e.trackStatusChanged();
                    },
                    function (a) {
                        e.sourceFailed(c, d, "Error Decoding File Type");
                    }
                );
            }),
            (a.prototype.makeRequest = function (a, b) {
                var c = this,
                    d = $(this.trackSources[a][b]).attr("src"),
                    e = new XMLHttpRequest();
                e.open("GET", d, !0),
                    (e.responseType = "arraybuffer"),
                    (e.onreadystatechange = function () {
                        4 === e.readyState &&
                            (200 === e.status
                                ? c.decodeAudio(e, a, b)
                                : c.sourceFailed(a, b, "404 - File Not Found"));
                    }),
                    e.send();
            }),
            (a.prototype.prepareRequest = function (a, b) {
                void 0 !== this.trackSources[a][b]
                    ? this.makeRequest(a, b)
                    : this.sourceFailed(a, b, "No Source Found");
            }),
            (a.prototype.load = function (a) {
                if (!this.valid_click(a)) return !0;
                a.preventDefault();
                var b = this;
                if (
                    (this.element
                        .find(".overlay span.activate")
                        .addClass("fa-spin loading"),
                        this.numberOfTracks > 0)
                ) {
                    var c = document.createElement("audio"),
                        d = {
                            ".aac": "audio/aac;",
                            ".aif": "audio/aiff;",
                            ".aiff": "audio/aiff;",
                            ".au": "audio/basic;",
                            ".mp1": "audio/mpeg;",
                            ".mp2": "audio/mpeg;",
                            ".mp3": "audio/mpeg;",
                            ".mpg": "audio/mpeg;",
                            ".mpeg": "audio/mpeg;",
                            ".m4a": "audio/mp4;",
                            ".mp4": "audio/mp4;",
                            ".oga": "audio/ogg;",
                            ".ogg": "audio/ogg;",
                            ".wav": "audio/wav;",
                            ".webm": "audio/webm;",
                        };
                    this.element.find("ts-track").each(function (a) {
                        b.trackSources[a] = $(this).find("ts-source");
                        for (var e = 0; e < b.trackSources[{
                            if(void 0 !== $(b.trackSources[a][e]).attr("type"))
                            var f = $(b.trackSources[a][e]).attr("type") + ";";
                else {
                            var g = $(b.trackSources[a][e])
                                .attr("src")
                                .substring(
                                    $(b.trackSources[a][e]).attr("src").lastIndexOf(".")
                                );
                            console.log(g);
                            var f = void 0 !== d[g] ? d[g] : "audio/" + g.substr(1) + ";";
                        }
                        (c.canPlayType && c.canPlayType(f).replace(/no/, "")) ||
                            b.trackSources[a].splice(e, 1);
                    }
            });
            }
          for (var e = 0; e < this.trackSources.length; e++)
            this.prepareRequest(e, 0);
        return a.stopPropagation(), !1;
    }),
    (a.prototype.findLongest = function () {
        for (var a = 0; a < this.numberOfTracks; {
            var b = this.trackBuffer[a].buffer.duration;
            b > this.longestDuration && (this.longestDuration = b);
    }
          this.element.trigger("loaded");
        }),
(a.prototype.trackStatusChanged = function () {
    var a = 0,
        b = 0;
    this.trackProperties.forEach(function (c) {
        (a += c.success || c.error ? 1 : 0), (b += c.error ? 1 : 0);
    }),
        a === this.numberOfTracks &&
        (0 === b
            ? this.findLongest()
            : (this.element.trigger("errored"),
                this.element
                    .find("#overlaytext")
                    .html("One or more audio files failed to load.")));
}),
    (a.prototype.loaded = function () {
        this.element.find(".overlay").removeClass("loading"),
            this.element.find(".overlay").hide().remove(),
            $(this.element).find(".timing .time").html("00:00:00:000"),
            $(this.element)
                .find(".timing .length")
                .html(this.secondsToHHMMSSmmm(this.longestDuration)),
            this.apply_track_properties(),
            this.bindEvents();
    }),
    (a.prototype.errored = function () {
        this.element.find(".overlay span").removeClass("fa-spin loading"),
            this.element.addClass("error");
        var a = this;
        this.trackProperties.forEach(function (b, c) {
            b.error &&
                $(a.element)
                    .find(".track_list > li:nth-child(" + (c + 1) + ")")
                    .addClass("error");
        }),
            this.unbindEvents();
    }),
    (a.prototype.unbindEvents = function () {
        this.element.off("touchstart mousedown", ".overlay span"),
            this.element.off("loaded"),
            this.element.off("touchstart mousedown", ".playpause"),
            this.element.off("touchstart mousedown", ".stop"),
            this.element.off("touchstart mousedown", ".repeat"),
            this.element.off("mousedown touchstart", ".seekwrap"),
            this.element.off("mousemove touchmove"),
            this.element.off("mouseup touchend"),
            this.element.off("touchstart mousedown", ".mute"),
            this.element.off("touchstart mousedown", ".solo"),
            this.options.spacebar && $(window).unbind("keypress");
    }),
    (a.prototype.bindEvents = function () {
        if (
            (this.element.on(
                "touchstart mousedown",
                ".playpause",
                $.proxy(this.event_playpause, this)
            ),
                this.element.on(
                    "touchstart mousedown",
                    ".stop",
                    $.proxy(this.event_stop, this)
                ),
                this.element.on(
                    "touchstart mousedown",
                    ".repeat",
                    $.proxy(this.event_repeat, this)
                ),
                this.element.on(
                    "mousedown touchstart",
                    ".seekwrap",
                    $.proxy(this.event_seekStart, this)
                ),
                this.element.on(
                    "mousemove touchmove",
                    $.proxy(this.event_seekMove, this)
                ),
                this.element.on(
                    "mouseup touchend",
                    $.proxy(this.event_seekEnd, this)
                ),
                this.element.on(
                    "touchstart mousedown",
                    ".mute",
                    $.proxy(this.event_mute, this)
                ),
                this.element.on(
                    "touchstart mousedown",
                    ".solo",
                    $.proxy(this.event_solo, this)
                ),
                this.options.spacebar)
        ) {
            var a = this;
            $(window).unbind("keypress"),
                $(window).keypress(function (b) {
                    32 === b.which && a.event_playpause(b);
                });
        }
    }),
    (a.prototype.valid_click = function (a) {
        return (
            "touchstart" === a.type || ("mousedown" === a.type && 1 === a.which)
        );
    }),
    (a.prototype.secondsToHHMMSSmmm = function (a) {
        var b = parseInt(a / 3600) % 24;
        b = b < 10 ? "0" + b : b;
        var c = parseInt(a / 60) % 60;
        c = c < 10 ? "0" + c : c;
        var d = a % 60;
        (d = d.toString().split(".")[0]), (d = d < 10 ? "0" + d : d);
        var e = Math.round((a % 1) * 1e3);
        return (
            (e = e < 10 ? "00" + e : e < 100 ? "0" + e : e),
            b + ":" + c + ":" + d + ":" + e
        );
    }),
    (a.prototype.updateMainControls = function () {
        this.element.find(".playpause").toggleClass("checked", this.playing),
            this.element.find(".repeat").toggleClass("checked", this.repeat);
        var a = (this.position / this.longestDuration) * 100;
        this.element.find(".seekhead").each(function () {
            $(this).css({ left: a + "%" });
        }),
            0 !== this.longestDuration &&
            $(this.element)
                .find(".timing .time")
                .html(this.secondsToHHMMSSmmm(this.position));
    }),
    (a.prototype.monitorPosition = function (a) {
        (a.position =
            a.playing && !a.currentlySeeking
                ? b.currentTime - a.startTime
                : a.position),
            a.position >= a.longestDuration &&
            !a.currentlySeeking &&
            ((a.position = 0),
                a.stopAudio(),
                a.repeat ? a.startAudio(a.position) : (a.playing = !1)),
            a.updateMainControls();
    }),
    (a.prototype.stopAudio = function () {
        var a = b.currentTime;
        this.gainNodeMaster.gain.cancelScheduledValues(a),
            this.gainNodeMaster.gain.setValueAtTime(1, a),
            this.gainNodeMaster.gain.linearRampToValueAtTime(0, a + 0.03);
        for (var c = 0; c < this.numberOfTracks; c++)
            this.activeAudioSources[c].stop(a + 0.03);
        clearInterval(this.timerMonitorPosition);
    }),
    (a.prototype.startAudio = function (a, c) {
        var d = this,
            e = b.currentTime,
            f = (downwardRamp = 0.03);
        this.position = void 0 !== a ? a : this.position || 0;
        for (var g = 0; g < this.numberOfTracks; g++)
            (this.activeAudioSources[g] = null),
                (this.activeAudioSources[g] = b.createBufferSource()),
                (this.activeAudioSources[g].buffer = this.trackBuffer[g].buffer),
                this.activeAudioSources[g].connect(this.trackGainNode[g]),
                void 0 !== c
                    ? (this.gainNodeMaster.gain.setValueAtTime(0, e + downwardRamp),
                        this.gainNodeMaster.gain.linearRampToValueAtTime(
                            1,
                            e + downwardRamp + f
                        ),
                        this.activeAudioSources[g].start(
                            e + downwardRamp,
                            this.position + downwardRamp,
                            f + c
                        ),
                        this.gainNodeMaster.gain.setValueAtTime(
                            1,
                            e + downwardRamp + f
                        ),
                        this.gainNodeMaster.gain.linearRampToValueAtTime(
                            0,
                            e + downwardRamp + f + c
                        ))
                    : (this.gainNodeMaster.gain.cancelScheduledValues(e),
                        this.gainNodeMaster.gain.setValueAtTime(0, e),
                        this.gainNodeMaster.gain.linearRampToValueAtTime(1, e + f),
                        this.activeAudioSources[g].start(e, this.position));
        (this.startTime = e - (this.position || 0)),
            (this.timerMonitorPosition = setInterval(function () {
                d.monitorPosition(d);
            }, 16));
    }),
    (a.prototype.pause = function () {
        !0 === this.playing &&
            (this.stopAudio(),
                (this.position = b.currentTime - this.startTime),
                (this.playing = !1),
                this.updateMainControls());
    }),
    (a.prototype.other_instances = function () {
        return $(".jquery-trackswitch").not(this.element);
    }),
    (a.prototype.pause_others = function () {
        this.options.globalsolo &&
            this.other_instances().each(function () {
                $(this)
                    .data("plugin_" + c)
                    .pause();
            });
    }),
    (a.prototype.event_playpause = function (a) {
        return (
            (!this.valid_click(a) && 32 !== a.which) ||
            (a.preventDefault(),
                this.playing
                    ? this.pause()
                    : (this.startAudio(),
                        this.pause_others(),
                        (this.playing = !0),
                        this.updateMainControls()),
                a.stopPropagation(),
                !1)
        );
    }),
    (a.prototype.event_stop = function (a) {
        if (!this.valid_click(a)) return !0;
        a.preventDefault();
        return (
            this.playing && this.stopAudio(),
            (this.position = 0),
            (this.playing = !1),
            this.updateMainControls(),
            a.stopPropagation(),
            !1
        );
    }),
    (a.prototype.event_repeat = function (a) {
        return (
            !this.valid_click(a) ||
            (a.preventDefault(),
                (this.repeat = !this.repeat),
                this.updateMainControls(),
                a.stopPropagation(),
                !1)
        );
    }),
    (a.prototype.seek = function (a) {
        if (a.type.indexOf("mouse") >= 0)
            var b = a.pageX - $(this.seekingElement).offset().left;
        else
            var b =
                a.originalEvent.touches[0].pageX -
                $(this.seekingElement).offset().left;
        var c = $(this.seekingElement).width();
        c = c < 1 ? 1 : c;
        var d = b < 0 ? 0 : b > c ? c : b,
            e = (d / c) * 100,
            f = this.longestDuration * (e / 100);
        b >= 0 && b <= c && this.playing
            ? (this.stopAudio(), this.startAudio(f, 0.03))
            : (this.position = f),
            this.updateMainControls();
    }),
    (a.prototype.event_seekStart = function (a) {
        return (
            !this.valid_click(a) ||
            (a.preventDefault(),
                (this.seekingElement = $(a.target).closest(".seekwrap")),
                this.seek(a),
                (this.currentlySeeking = !0),
                a.stopPropagation(),
                !1)
        );
    }),
    (a.prototype.event_seekMove = function (a) {
        if (this.currentlySeeking) return a.preventDefault(), this.seek(a), !1;
        a.stopPropagation();
    }),
    (a.prototype.event_seekEnd = function (a) {
        return (
            a.preventDefault(),
            this.currentlySeeking && this.playing && this.startAudio(),
            (this.currentlySeeking = !1),
            a.stopPropagation(),
            !1
        );
    }),
    (a.prototype._index_from_target = function (a) {
        return $(a).closest(".track").prevAll().length;
    }),
    (a.prototype.event_solo = function (a) {
        if (!this.valid_click(a)) return !0;
        var b = this._index_from_target(a.target),
            c = this,
            d = this.trackProperties[b].solo;
        (a.shiftKey || this.options.radiosolo) &&
            $.each(this.trackProperties, function (a, b) {
                c.trackProperties[a].solo = !1;
            }),
            (this.options.radiosolo || a.shiftKey) && d
                ? (this.trackProperties[b].solo = !0)
                : (this.trackProperties[b].solo = !d),
            this.apply_track_properties();
    }),
    (a.prototype.event_mute = function (a) {
        if (!this.valid_click(a)) return !0;
        a.preventDefault();
        var b = this._index_from_target(a.target);
        return (
            (this.trackProperties[b].mute = !this.trackProperties[b].mute),
            this.apply_track_properties(),
            a.stopPropagation(),
            !1
        );
    }),
    (a.prototype.switch_image = function () {
        var a,
            b = this,
            c = 0;
        $.each(this.trackProperties, function (d, e) {
            !0 === b.trackProperties[d].solo &&
                (c++, (a = b.element.find("ts-track")[d].dataset.img));
        }),
            (1 !== c || void 0 === a || a.length < 1) && (a = this.originalImage),
            this.element.find(".seekable").attr("src", a);
    }),
    (a.prototype.apply_track_properties = function () {
        var a = this,
            b = !1;
        $.each(this.trackProperties, function (c, d) {
            b = b || a.trackProperties[c].solo;
        }),
            $.each(this.trackProperties, function (c, d) {
                var e = a.element.find(
                    ".track_list li.track:nth-child(" + (c + 1) + ")"
                );
                a.trackProperties[c].mute
                    ? e.find(".mute").addClass("checked")
                    : e.find(".mute").removeClass("checked"),
                    a.trackProperties[c].solo
                        ? e.find(".solo").addClass("checked")
                        : e.find(".solo").removeClass("checked"),
                    a.trackGainNode.length > 0 &&
                    ((a.trackGainNode[c].gain.value = 1),
                        a.trackProperties[c].mute
                            ? (a.trackGainNode[c].gain.value = 0)
                            : (a.trackGainNode[c].gain.value = 1),
                        b &&
                        (a.trackProperties[c].solo
                            ? (a.trackGainNode[c].gain.value = 1)
                            : (a.trackGainNode[c].gain.value = 0)));
            }),
            this.switch_image(),
            this.deselect();
    }),
    (a.prototype.deselect = function (a) {
        var b =
            "getSelection" in window
                ? window.getSelection()
                : "selection" in document
                    ? document.selection
                    : null;
        "removeAllRanges" in b
            ? b.removeAllRanges()
            : "empty" in b && b.empty();
    }),
    ($.fn[c] = function (b) {
        return this.each(function () {
            $(this).data("plugin_" + c) ||
                $(this).data("plugin_" + c, new a(this, b));
        });
    });
    }) ();
