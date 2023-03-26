// configuration
var DEFAULT_PLAY_TIMEOUT = 10000;
window.$ =
	window.$ ||
	function () {
		return window.$;
	};

// utility functions
if (undefined == window.console) {
	window.console = { log: function () { } };
}

/**
 * This class provides helpers to load JavaScript resources and JSON data.
 * @class Loader
 */
function Loader() {
	var FINAL_STATES = { loaded: true, complete: true, 4: true };
	var head = document.getElementsByTagName("head")[0];
	var pending = {};
	var counter = 0;
	return {
		/**
		 * @private
		 * @callback dataCallback
		 * @memberof Loader.prototype
		 * @param {object|string} data JSON object, or string returned by request as `responseText`.
		 */
		/**
		 * Loads and returns a JSON resource asynchronously, using XMLHttpRequest (AJAX).
		 * @memberof Loader.prototype
		 * @param {string} src HTTP(S) URL of the JSON resource to load.
		 * @param {dataCallback} cb Callback function with request's data as first parameter.
		 */
		loadJSON: function (src, cb) {
			// if (pending[src]) return cb && cb();
			// pending[src] = true;
			// cross-domain ajax call
			var xdr = new window.XMLHttpRequest();
			xdr.onload = function () {
				var data = xdr.responseText;
				try {
					data = JSON.parse(data);
				} catch (e) { }
				cb(data);
				// delete pending[src];
			};
			xdr.open("GET", src, true);
			xdr.send();
		},
		/**
		 * @private
		 * @callback errorCallback
		 * @memberof Loader.prototype
		 * @param {Error} error Error caught thru the `error` event or `appendChild()` call, if any.
		 */
		/**
		 * Loads a JavaScript resource into the page.
		 * @memberof Loader.prototype
		 * @param {string} src HTTP(S) URL of the JavaScript resource to load into the page.
		 * @param {errorCallback} cb Callback function with error as first parameter, if any.
		 */
		includeJS: function (src, cb) {
			var inc, nt;
			if (pending[src]) {
				if (cb) {
					nt = setInterval(function () {
						if (pending[src]) {
							return console.log("still loading", src, "...");
						}
						clearInterval(nt);
						cb();
					}, 50);
				}
				return;
			}
			pending[src] = true;
			inc = document.createElement("script");
			// inc.async = "async";
			inc.onload = function () {
				if (!pending[src]) {
					return;
				}
				delete pending[src];
				cb && setTimeout(cb, 1);
				delete inc.onload;
			};
			inc.onerror = function (e) {
				e.preventDefault();
				inc.onload(e);
			};
			inc.onreadystatechange = function () {
				if (!inc.readyState || FINAL_STATES[inc.readyState]) {
					inc.onload();
				}
			};
			try {
				inc.src = src;
				head.appendChild(inc);
			} catch (e) {
				console.error("Error while including", src, e);
				cb(e);
			}
		},
		/**
		 * Loads and returns a JSON resource asynchronously, by including it into the page (not AJAX).
		 * @memberof Loader.prototype
		 * @param {string} src HTTP(S) URL of the JSON resource to load.
		 * @param {function} cb Callback function, called by the resource's script.
		 */
		loadJSONP: function (src, cb) {
			var callbackFct = "__loadjsonp__" + counter++;
			window[callbackFct] = function () {
				cb.apply(window, arguments);
				delete window[callbackFct];
			};
			this.includeJS(
				src + (src.indexOf("?") == -1 ? "?" : "&") + "callback=" + callbackFct,
				function () {
					// if http request fails (e.g. 404 error / no content)
					setTimeout(window[callbackFct], 10);
				}
			);
		},
	};
}

window.loader = new Loader();

// EventEmitter
function EventEmitter() {
	this._eventListeners = {};
}

EventEmitter.prototype.on = function (eventName, handler) {
	this._eventListeners[eventName] = (
		this._eventListeners[eventName] || []
	).concat(handler);
};

EventEmitter.prototype.emit = function (eventName) {
	var i;
	var args = Array.prototype.slice.call(arguments, 1); // remove eventName from arguments, and make it an array
	var listeners = this._eventListeners[eventName];
	for (i in listeners) {
		listeners[i].apply(null, args);
	}
};

/**
 * Inherit the prototype methods from one constructor into another. (from Node.js)
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 * @ignore => this function will not be included in playemjs' generated documentation
 */
function inherits(ctor, superCtor) {
	ctor.super_ = superCtor;
	ctor.prototype = Object.create(superCtor.prototype, {
		constructor: {
			value: ctor,
			enumerable: false,
			writable: true,
			configurable: true,
		},
	});
}

/**
 * Plays a sequence of streaming audio/video tracks by embedding the corresponding players
 * into the page.
 *
 * Events:
 * - "onError", {code,source}
 * - "onReady"
 * - "onPlay"
 * - "onPause"
 * - "onEnd"
 * - "onTrackInfo", track{}
 * - "onTrackChange", track{}
 * - "loadMore"
 * @param {Object} playemPrefs Settings and preferences.
 * @param {Boolean} playemPrefs.loop - If true, the playlist will be played infinitely. (default: true)
 * @param {Number} playemPrefs.playTimeoutMs - Number of milliseconds after which an error event will be fired, if a tracks was not able to play. (default: 10000, i.e. 10 seconds)
 */

function Playem(playemPrefs) {
	function Playem(playemPrefs) {
		EventEmitter.call(this);

		playemPrefs = playemPrefs || {};
		playemPrefs.loop = playemPrefs.hasOwnProperty("loop")
			? playemPrefs.loop
			: true;
		playemPrefs.playTimeoutMs =
			playemPrefs.playTimeoutMs || DEFAULT_PLAY_TIMEOUT;

		var players = []; // instanciated Player classes, added by client
		var i;
		var exportedMethods;
		var currentTrack = null;
		var trackList = [];
		var whenReady = null;
		var playersToLoad = 0;
		var progress = null;
		var that = this;
		var playTimeout = null;
		var volume = 1;

		/**
		 * @memberof Playem.prototype
		 * @param {string} key Key of the Playem parameter to set.
		 * @param {any} val Value to affect to that `key`.
		 */
		this.setPref = function (key, val) {
			playemPrefs[key] = val;
		};

		function doWhenReady(player, fct) {
			var interval = null;
			function poll() {
				if (player.isReady && interval) {
					clearInterval(interval);
					fct();
				} else {
					console.warn("PLAYEM waiting for", player.label, "...");
				}
			}
			if (player.isReady) {
				setTimeout(fct);
			} else {
				interval = setInterval(poll, 1000);
			}
		}

		function addTrack(metadata, url) {
			var track = {
				index: trackList.length,
				metadata: metadata || {},
			};
			if (url) {
				track.url = url;
			}
			trackList.push(track);
			return track;
		}

		function addTrackById(id, player, metadata) {
			if (id) {
				var track = addTrack(metadata);
				track.trackId = id;
				track.player = player;
				track.playerName = player.label.replace(/ /g, "_");
				return track;
				// console.log("added:", player.label, "track", id, track/*, metadata*/);
			} else {
				throw new Error("no id provided");
			}
		}

		function searchTracks(query, handleResult) {
			var expected = 0;
			var i;
			var currentPlayer;
			for (i = 0; i < players.length; i++) {
				currentPlayer = players[i];
				// Search for player extending the "searchTracks" method.
				if (typeof currentPlayer.searchTracks === "function") {
					expected++;
					currentPlayer.searchTracks(query, 5, function (results) {
						for (var i in results) {
							handleResult(results[i]);
						}
						if (--expected === 0) {
							handleResult();
						} // means: "i have no (more) results to provide for this request"
					});
				}
			}
		}

		function setVolume(vol) {
			volume = vol;
			callPlayerFct("setVolume", vol);
		}

		function stopTrack() {
			if (progress) {
				clearInterval(progress);
			}
			for (var i in players) {
				if (players[i].stop) {
					players[i].stop();
				} else {
					players[i].pause();
				}
			}
			try {
				window.soundManager.stopAll();
			} catch (e) {
				// console.error('playem tried to stop all soundManager sounds =>', e)
			}
		}

		function playTrack(track) {
			// console.log("playTrack", track);
			stopTrack();
			currentTrack = track;
			delete currentTrack.trackPosition; // = null;
			delete currentTrack.trackDuration; // = null;
			that.emit("onTrackChange", track);
			if (!track.player) {
				return that.emit("onError", {
					code: "unrecognized_track",
					source: "Playem",
					track: track,
				});
			}
			doWhenReady(track.player, function () {
				// console.log("playTrack #" + track.index + " (" + track.playerName+ ")", track);
				callPlayerFct("play", track.trackId);
				setVolume(volume);
				if (currentTrack.index == trackList.length - 1) {
					that.emit("loadMore");
				}
				// if the track does not start playing within 7 seconds, skip to next track
				setPlayTimeout(function () {
					// console.warn('PLAYEM TIMEOUT') // => skipping to next song
					that.emit("onError", { code: "timeout", source: "Playem" });
					// exportedMethods.next();
				});
			});
		}

		function setPlayTimeout(handler) {
			if (playTimeout) {
				clearTimeout(playTimeout);
			}
			playTimeout = !handler
				? null
				: setTimeout(handler, playemPrefs.playTimeoutMs);
		}

		function callPlayerFct(fctName, param) {
			try {
				return currentTrack.player[fctName](param);
			} catch (e) {
				console.warn("Player call error", fctName, e, e.stack);
			}
		}

		// functions that are called by players => to propagate to client
		function createEventHandlers(playemFunctions) {
			var eventHandlers = {
				onApiReady: function (player) {
					// console.log(player.label + " api ready");
					if (whenReady && player == whenReady.player) {
						whenReady.fct();
					}
					if (--playersToLoad == 0) {
						that.emit("onReady");
					}
				},
				onEmbedReady: function (player) {
					// console.log("embed ready");
					setVolume(volume);
				},
				onBuffering: function (player) {
					setTimeout(function () {
						setPlayTimeout();
						that.emit("onBuffering");
					});
				},
				onPlaying: function (player) {
					// console.log(player.label + ".onPlaying");
					// setPlayTimeout(); // removed because soundcloud sends a "onPlaying" event, even for not authorized tracks
					setVolume(volume);
					setTimeout(function () {
						that.emit("onPlay");
					}, 1);
					if (player.trackInfo && player.trackInfo.duration) {
						eventHandlers.onTrackInfo({
							position: player.trackInfo.position || 0,
							duration: player.trackInfo.duration,
						});
					}

					if (progress) {
						clearInterval(progress);
					}

					if (player.getTrackPosition) {
						// var that = eventHandlers; //this;
						progress = setInterval(function () {
							player.getTrackPosition(function (trackPos) {
								eventHandlers.onTrackInfo({
									position: trackPos,
									duration:
										player.trackInfo.duration || currentTrack.trackDuration,
								});
							});
						}, 1000);
					}
				},
				onTrackInfo: function (trackInfo) {
					// console.log("ontrackinfo", trackInfo, currentTrack);
					if (currentTrack && trackInfo) {
						if (trackInfo.duration) {
							currentTrack.trackDuration = trackInfo.duration;
							setPlayTimeout();
						}
						if (trackInfo.position) {
							currentTrack.trackPosition = trackInfo.position;
						}
					}
					that.emit("onTrackInfo", currentTrack);
				},
				onPaused: function (player) {
					// console.log(player.label + ".onPaused");
					setPlayTimeout();
					if (progress) {
						clearInterval(progress);
					}
					progress = null;
					// if (!avoidPauseEventPropagation)
					//  that.emit("onPause");
					// avoidPauseEventPropagation = false;
				},
				onEnded: function (player) {
					// console.log(player.label + ".onEnded");
					stopTrack();
					that.emit("onEnd");
					playemFunctions.next();
				},
				onError: function (player, error) {
					console.error(
						player.label + " error:",
						((error || {}).exception || error || {}).stack || error
					);
					setPlayTimeout();
					that.emit("onError", error);
				},
			};
			// handlers will only be triggered is their associated player is currently active
			[
				"onEmbedReady",
				"onBuffering",
				"onPlaying",
				"onPaused",
				"onEnded",
				"onError",
			].map(function (evt) {
				var fct = eventHandlers[evt];
				eventHandlers[evt] = function (player, x) {
					if (currentTrack && player == currentTrack.player) {
						return fct(player, x);
					}
					/*
							  else if (evt != "onEmbedReady")
								  console.warn("ignore event:", evt, "from", player, "instead of:", currentTrack.player);
							  */
				};
			});
			return eventHandlers;
		}

		// exported methods, mostly wrappers to Players' methods
		exportedMethods = {
			addPlayer: function (PlayerClass, vars) {
				playersToLoad++;
				var player = new PlayerClass(createEventHandlers(this, vars), vars);
				players.push(player);
				return player;
			},
			getPlayers: function () {
				return players;
			},
			getQueue: function () {
				return trackList;
			},
			clearQueue: function () {
				trackList = [];
			},
			addTrackByUrl: function (url, metadata) {
				var p, player, eid;
				for (p = 0; p < players.length; ++p) {
					player = players[p];
					eid = player.getEid(url);
					if (eid) {
						return addTrackById(eid, player, metadata);
					}
				}
				return addTrack(metadata, url);
			},
			getTrackInfo: (url, cb) => {
				var p, player;
				for (p = 0; p < players.length; ++p) {
					player = players[p];
					player.fetchMetadata(url, (item) => {
						cb(item);
					});
				}
			},
			play: function (i) {
				playTrack(i != undefined ? trackList[i] : currentTrack || trackList[0]);
			},
			pause: function () {
				callPlayerFct("pause");
				that.emit("onPause");
			},
			stop: stopTrack,
			resume: function () {
				callPlayerFct("resume");
			},
			next: function () {
				if (playemPrefs.loop || currentTrack.index + 1 < trackList.length) {
					playTrack(trackList[(currentTrack.index + 1) % trackList.length]);
				}
			},
			prev: function () {
				playTrack(
					trackList[
					(trackList.length + currentTrack.index - 1) % trackList.length
					]
				);
			},
			seekTo: function (pos) {
				if ((currentTrack || {}).trackDuration) {
					callPlayerFct("setTrackPosition", pos * currentTrack.trackDuration);
				}
			},
			setVolume: setVolume,
			searchTracks: searchTracks,
		};

		// return exportedMethods;
		for (i in exportedMethods) {
			this[i] = exportedMethods[i];
		}
	}

	inherits(Playem, EventEmitter);

	return new Playem();
}

try {
	module.exports = Playem;
} catch (e) { }

window.$ =
	window.$ ||
	function () {
		return window.$;
	};
$.show =
	$.show ||
	function () {
		return $;
	};
$.attr =
	$.attr ||
	function () {
		return $;
	};
$.getScript =
	$.getScript ||
	function (js, cb) {
		loader.includeJS(js, cb);
	};

function YoutubePlayer() {
	return YoutubePlayer.super_.apply(this, arguments);
}

(function () {
	//includeJS("https://www.youtube.com/player_api");
	var EVENT_MAP = {
		0: "onEnded",
		1: "onPlaying",
		2: "onPaused",
		//  3: "onBuffering", // youtube state: buffering
		//  5: "onBuffering", // youtube state: cued
	},
		SDK_URL = "https://apis.google.com/js/client.js?onload=initYT",
		SDK_LOADED = false,
		PLAYER_API_SCRIPT = "https://www.youtube.com/iframe_api",
		PLAYER_API_LOADED = false,
		YOUTUBE_VIDEO_URL = "https://www.youtube.com/watch?v=",
		apiReady = false,
		DEFAULT_PARAMS = {
			width: "200",
			height: "200",
			playerVars: {
				autoplay: 1,
				version: 3,
				enablejsapi: 1,
				controls: 0,
				modestbranding: 1,
				showinfo: 0,
				wmode: "opaque",
				iv_load_policy: 3,
				allowscriptaccess: "always",
			},
		};

	function whenApiReady(cb) {
		setTimeout(function () {
			if (SDK_URL && apiReady && PLAYER_API_LOADED) {
				cb();
			} else {
				whenApiReady(cb);
			}
		}, 200);
	}

	window.onYouTubeIframeAPIReady = function () {
		PLAYER_API_LOADED = true;
	};

	// called by $.getScript(SDK_URL)
	window.initYT = function () {
		gapi.client.setApiKey("AIzaSyB_gyjrellrDFFW2BELstydonC0G8A2e5A");
		gapi.client.load("youtube", "v3", function () {
			apiReady = true;
			$.getScript(PLAYER_API_SCRIPT, function () {
				// will call window.onYouTubeIframeAPIReady()
			});
		});
	};

	if (!SDK_LOADED) {
		$.getScript(SDK_URL, function () {
			// will call window.initYT()
			SDK_LOADED = true;
		});
	} else if (!apiReady) {
		window.initYT();
	}

	function Player(eventHandlers, embedVars) {
		this.eventHandlers = eventHandlers || {};
		this.embedVars = embedVars || {};
		this.label = "Youtube";
		this.isReady = false;
		this.trackInfo = {};
		this.player = {};
		var that = this;
		window.onYoutubeStateChange = function (newState) {
			if (newState.data == YT.PlayerState.PLAYING) {
				that.trackInfo.duration = that.player.getDuration();
			}
			//console.log("------> YT newState:", newState, newState.data);
			var eventName = EVENT_MAP[newState.data];
			if (eventName && that.eventHandlers[eventName])
				that.eventHandlers[eventName](that);
		};

		window.onYoutubeError = function (error) {
			//console.log(that.embedVars.playerId + " error:", error);
			eventHandlers.onError &&
				eventHandlers.onError(that, { source: "YoutubePlayer", code: error });
		};

		whenApiReady(function () {
			that.isReady = true;
			if (that.eventHandlers.onApiReady) that.eventHandlers.onApiReady(that);
		});
	}

	Player.prototype.safeCall = function (fctName, param) {
		try {
			var args = Array.apply(null, arguments).slice(1), // exclude first arg (fctName)
				fct = (this.element || {})[fctName];
			//console.log(fctName, args, this.element)
			fct && fct.apply(this.element, args);
		} catch (e) {
			console.error("YT safecall error", e, e.stack);
		}
	};

	Player.prototype.safeClientCall = function (fctName, param) {
		try {
			if (this.eventHandlers[fctName]) this.eventHandlers[fctName](param);
		} catch (e) {
			console.error("YT safeclientcall error", e.stack);
		}
	};

	Player.prototype.embed = function (vars) {
		this.embedVars = vars = vars || {};
		this.embedVars.playerId = this.embedVars.playerId || "ytplayer";
		this.trackInfo = {};
		this.embedVars.playerContainer.innerHTML = "";
		this.element = document.createElement("div");
		this.element.id = this.embedVars.playerId;
		this.embedVars.playerContainer.appendChild(this.element);
		$(this.element).show();

		var that = this;
		that.player = new YT.Player(
			that.embedVars.playerId || "ytplayer",
			DEFAULT_PARAMS
		);
		that.player.addEventListener("onStateChange", "onYoutubeStateChange");
		that.player.addEventListener("onError", "onYoutubeError");
		that.element = that.player.getIframe();
		that.player.addEventListener("onReady", function (event) {
			that.safeClientCall("onEmbedReady");
			that.player.loadVideoById(that.embedVars.videoId);
		});
	};

	Player.prototype.getEid = function (url) {
		if (
			/(youtube\.com\/(v\/|embed\/|(?:.*)?[\?\&]v=)|youtu\.be\/)([a-zA-Z0-9_\-]+)/.test(url) ||
			/^\/yt\/([a-zA-Z0-9_\-]+)/.test(url) ||
			/youtube\.com\/attribution_link\?.*v\%3D([^ \%]+)/.test(url) ||
			/youtube.googleapis.com\/v\/([a-zA-Z0-9_\-]+)/.test(url)
		)
			return RegExp.lastParen;
	};

	function searchTracks(query, limit, cb) {
		function translateResult(r) {
			var id = typeof r.id !== "string" ? r.id.videoId : r.id;
			return {
				id: id,
				eId: "/yt/" + id,
				img: r.snippet.thumbnails["default"].url,
				url: YOUTUBE_VIDEO_URL + id,
				title: r.snippet.title,
				playerLabel: "Youtube",
			};
		}
		if (!cb) return;
		whenApiReady(function () {
			if (limit !== 1) {
				gapi.client.youtube.search
					.list({
						part: "snippet",
						q: YOUTUBE_VIDEO_URL + query,
						type: "video",
						maxResults: limit,
					})
					.execute(function (res) {
						if (res.error) throw res.error; // e.g. 403 / "quota exceeded" error
						results = res.items.map(translateResult);
						cb(results);
					});
			} else {
				gapi.client.youtube.videos
					.list({
						id: query,
						part: "snippet,contentDetails,statistics",
					})
					.execute(function (res) {
						if (res.error) throw res.error; // e.g. 403 / "quota exceeded" error
						results = res.items.map(translateResult);
						cb(results);
					});
			}
		});
	}

	Player.prototype.searchTracks = function (query, limit, cb) {
		searchTracks(query, limit, cb);
	};

	function fetchMetadata(id, cb) {
		searchTracks(id, 1, function (tracks) {
			cb(tracks[0]);
		});
	}

	Player.prototype.fetchMetadata = function (url, cb) {
		var id = this.getEid(url);
		if (!id) return cb();
		else fetchMetadata(id, cb);
	};

	function cleanId(id) {
		return /([a-zA-Z0-9_\-]+)/.test(id) && RegExp.lastParen;
	}

	Player.prototype.play = function (id) {
		id = cleanId(id);
		//console.log("PLAY -> YoutubePlayer", this.currentId, id);
		if (!this.currentId || this.currentId != id) {
			this.embedVars.videoId = id;
			this.embed(this.embedVars);
		}
	};

	Player.prototype.pause = function () {
		//console.log("PAUSE -> YoutubePlayer"/*, this.element, this.element && this.element.pauseVideo*/);
		if (this.player && this.player.pauseVideo) this.player.pauseVideo();
	};

	Player.prototype.resume = function () {
		//console.log("RESUME -> YoutubePlayer", this.element, this.element && this.element.playVideo);
		if (this.player && this.player.playVideo) this.player.playVideo();
	};

	Player.prototype.stop = function () {
		try {
			this.player.stopVideo();
		} catch (e) { }
	};

	Player.prototype.getTrackPosition = function (callback) {
		if (callback && this.player && this.player.getCurrentTime)
			callback(this.player.getCurrentTime());
	};

	Player.prototype.setTrackPosition = function (pos) {
		// this.safeCall("seekTo", pos, true);
		if (this.player && this.player.seekTo) this.player.seekTo(pos);
	};

	Player.prototype.setVolume = function (vol) {
		if (this.player && this.player.setVolume) this.player.setVolume(vol * 100);
	};

	//return Player;
	//inherits(YoutubePlayer, Player);
	YoutubePlayer.prototype = Player.prototype;
	YoutubePlayer.super_ = Player;
})();

try {
	module.exports = YoutubePlayer;
} catch (e) { }
