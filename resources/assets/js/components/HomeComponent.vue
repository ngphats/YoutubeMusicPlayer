<template>
	<div class="container">
		
		<div class="row justify-content-center">
			<div class="col-md-6">
				<div :class="{ thumbnail: true, control: true }">
					<div class="control-player">
						<input type="text" @click="onSearch" placeholder="Search"/>
						<!-- <input type="text" v-model="search_key"/> -->
						<!-- <button type="button" class="btn btn-primary btn-sm" @click="search">Search</button> -->
					</div>
				</div>
			</div>
		</div>

		<div class="row justify-content-center">
			<div class="col-md-6">
				<div :class="{ thumbnail: true, control: true }">
					<div class="select-player">
						<select class="form-select" v-model="player_selected">
							<option v-for="option in list_player_active" :key="option.socket_id" :value="option.socket_id">
								{{ option.socket_id === socket.id ? "This Device" : option.player_ip }}
							</option>
						</select>
					</div>

					<div class="control-player">
						<button type="button" class="btn btn-primary btn-sm" @click="play()">Play</button>
						<button type="button" class="btn btn-primary btn-sm" @click="next">Next</button>
						<button type="button" class="btn btn-primary btn-sm" @click="stop">Stop</button>
						<button type="button" class="btn btn-primary btn-sm" @click="add">Add</button>
						<!-- <button type="button" class="btn btn-primary btn-sm" @click="tracks">Debug</button> -->
					</div>
				</div>
			</div>
		</div>

		<div class="row justify-content-center">
			<div class="col-md-6">
				<div v-for="track in playList" :key="track.id" :class="{ thumbnail: true, active_track: track.ytid == activeTrack }">
					<a @click="playTrack(track.ytid)"><img :src="track.thumbnail" style="width:100%"></a>
					<div class="caption">
						<p class="title">{{ track.title }}</p>
						<p>{{ track.message }}</p>
					</div>
				</div>
			</div>
		</div>
		
		<div class="modal fade" id="modalAdd" tabindex="-1" role="dialog" aria-labelledby="modalAddLabel" aria-hidden="true">
			<div class="modal-dialog" role="document">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title" id="modalAddLabel">Add</h5>
						<button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="formClearSubmit">
						<span aria-hidden="true">&times;</span>
						</button>
					</div>
					<div class="modal-body">
						<form>
						<div class="form-group">
							
							<label for="recipient-name" class="col-form-label">URL Youtube:</label>
							
							<input type="text" class="form-control" id="recipient-name" v-model="tmpFormLink">
							
							<div class="invalid-feedback" style="display: block" v-show="errorTmpFormLink.length > 0">
								{{errorTmpFormLink}}
							</div>

							<div v-for="track in playList" :key="track.id" :class="{ thumbnail: true, active_track: track.ytid == activeTrack }" v-show="track.ytid == 'J0AXbzJnCt4'">
								<a @click="playTrack(track.ytid)"><img :src="track.thumbnail" style="width:100%"></a>
								<div class="caption">
									<p class="title">{{ track.title }}</p>
									<p>{{ track.message }}</p>
								</div>
							</div>

						</div>
						<div class="form-group">
							<label for="message-text" class="col-form-label">Message:</label>
							<textarea class="form-control" id="message-text" v-model="tmpFormMessage"></textarea>
						</div>
						</form>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" data-dismiss="modal" @click="formClearSubmit">Close</button>
						<button type="button" class="btn btn-primary" @click="formAddSubmit">Add</button>
					</div>
				</div>
			</div>
		</div>

		<div class="modal" id="modalSearch" tabindex="-1" role="dialog" aria-labelledby="modalSearchLabel" aria-hidden="true">
			<div class="modal-dialog modal-dialog-scrollable" role="document">
				<div class="modal-content">
					
					<div class="modal-header">
						<div class="form-group">
							<input type="text" class="form-control" id="search-key" v-model="search_key" @input="searchTyping">
						</div>

						<button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="formClearSubmit">
							<span aria-hidden="true">&times;</span>
						</button>
					</div>

					<div class="modal-body" style="height: 600px">
						<div v-for="track in searchResultList" :key="track.id" :class="{ thumbnail: true }">
							<a><img :src="track.img" style="width:100%"></a>

							<div class="caption">
								<p class="title">{{ track.title }}</p>
								<p>{{ track.message }}</p>
							</div>

							<footer>
								<a @click="chooseTrack(track)">
									<span>add</span>
								</a>
							</footer>
						</div>
					</div>
				</div>
			</div>

		</div>

	</div>
</template>

<script>

import io from 'socket.io-client'

export default {
	data() {
		return {
			socket: {},
			playList: [],
			tmpFormLink: "",
			errorTmpFormLink: "",
			tmpFormMessage: "",
			myModalAdd: {},
			myModalSearch: {},
			playem: {},
			activeTrack: "",
			list_player_active: [],
			player_selected: "",
			search_key: "",
			delayTimerSearch: null,
			searchResultList: []
		};
	},
	created() {
		this.socket = io(serverURL, {
			autoConnect: true
		})

		this.socket.on('connect', () => {
			this.player_selected = this.socket.id
			this.socket.emit("player_active")
		})

		this.socket.on('list_player_active', params => {
			this.list_player_active = params
		})

        this.socket.on('add_new_track', params => {
			this.addTrack(params)
			this.playList.push(params)
		})

        this.socket.on('play', params => {
			this.playem.play(params.track_idx || 0);
		})

		this.socket.on('on_track_change', params => {
			if (params.player == this.player_selected) {
				this.activeTrack = params.track_active
			}
		})

        this.socket.on('player_connect', params => {
			console.log({params})
		})

        this.socket.on('player_disconnect', params => {
			console.log({params})
		})

		// init playem and players
		this.playem = new Playem();
		this.playem.addPlayer(YoutubePlayer, {
			playerContainer: document.getElementById("playem_video"),
		})

		this.playem.on("onTrackChange", (params) => {
			this.activeTrack = params.trackId
			this.socket.emit("on_track_change", {
				player: this.socket.id,
				track_active: params.trackId
			});			
		})

		// function logEvent (evtName) {
		// 	this.on(evtName, (data) => console.log("event:", evtName, data)
		// )}

		// init logging for all player events
		// ["onPlay", "onReady", "onTrackChange", "onEnd", "onPause", "onTrackInfo", "onError"].forEach(logEvent.bind(playem));
	},
	mounted() {
		this.view()
	},
	watch: {
		// searchResultList(newQuestion, oldQuestion) {
		// 	console.log({newQuestion, oldQuestion})
		// }
	},
	methods: {
		view() {
			axios.post(`/view`).then((response) => {
				let { status, data } = response.data
				if (typeof status === "string" && status === "OK") {
					data.forEach((item) => {
						this.playList.push(item)
						this.addTrack(item)
					})
				}
			})
		},
		create() {
			this.socket.emit("create", []);
		},
		disconnect() {
			this.socket.disconnect();
		},
		add() {
			if (Object.keys(this.myModalAdd).length === 0) {
				this.myModalAdd = new bootstrap.Modal(document.getElementById('modalAdd'), {
					keyboard: true,
					focus: true
				})
			}

			this.myModalAdd.show()
		},
		addTrack(track) {
			this.playem.addTrackByUrl(track.url)
		},
		play(ind) {
			if (this.player_selected === this.socket.id) {
				this.playem.play(ind || 0);
			} else {
				this.socket.emit("play", {
					player_selected: this.player_selected,
					track_idx: ind || 0
				});
			}
		},
		playTrack(selectTrack) {
			if (undefined == selectTrack) {
				return
			}

			let tracks = this.playem.getQueue()
			let indSelectTrack = tracks.findIndex(item => {
				return item.trackId === selectTrack
			})
			
			this.play(indSelectTrack)
		},
		tracks() {
			// let selectTrack = "_3-uD0PvM7g"
			// let snoop = '_Rks2oCRS88'

			// let tracks = this.playem.getQueue()
			// let tracks = this.playem.searchTracks(snoop, (item) => {
			// 	console.log(item)
			// })

			// console.log(tracks)
			// let indSelectTrack = tracks.findIndex(item => {
			// 	return item.trackId === selectTrack
			// })
		},
		next() {
			this.playem.next();
		},
		pause() {
			this.playem.pause();
		},
		update() {
			axios.post(`/update`).then((response) => {
				console.log(response.data)
			})
		},
		formAddSubmit() {
			if (null !== this.tmpFormLink && this.tmpFormLink.length > 0) {
				this.playem.getTrackInfo(this.tmpFormLink, (item) => {
					if (undefined === item) {
						this.errorTmpFormLink = "Không tìm thấy video, vui lòng kiểm tra lại URL."
					} else {
						let trackInfo = {
							ytid: item.id,
							thumbnail: item.img,
							title: item.title,
							url: item.url,
							message: this.tmpFormMessage
						}

						axios.post(`/add`, trackInfo).then((response) => {
							let { status, data } = response.data
							if (typeof status === "string" && status === "OK") {
								this.playList.push(data)
								this.addTrack(data)
								
								// add for all user..
								this.socket.emit("add_new_track", data);
							}
						})

						this.formClearSubmit()
						
						this.myModalAdd.hide()
					}
				})
			} else {
				this.errorTmpFormLink = "Xin mời nhập URL bài hát yêu thích của bạn."
			}
		},
		formClearSubmit() {			
			this.tmpFormLink = ""
			this.errorTmpFormLink = ""
			this.tmpFormMessage = ""
			this.search_key = ""
			this.delayTimerSearch = null
			this.searchResultList = []
		},
		search() {
			let keySearch = this.search_key
			if (keySearch.length == 0) {
				return
			}

			this.searchResultList = []

			this.playem.searchTracks(keySearch, (item) => {
				if (undefined == item) {
					return
				}

				this.searchResultList.push(item)
			})
		},
		stop() {
			this.playem.stop()
		},
		onSearch() {
			if (Object.keys(this.myModalSearch).length === 0) {
				this.myModalSearch = new bootstrap.Modal(document.getElementById('modalSearch'), {
					keyboard: true
				})
			}

			const modalSearch = document.getElementById('modalSearch')
			modalSearch.addEventListener(`show.bs.modal`, () => {
				console.log(`event show modal trigger..`)
			})

			this.myModalSearch.show()
		},
		searchTyping() {
			clearTimeout(this.delayTimerSearch)
			this.delayTimerSearch = setTimeout(this.search, 1000)
		},
		chooseTrack(track) {
			let trackInfo = {
				ytid: track.id,
				thumbnail: track.img,
				title: track.title,
				url: track.url,
				message: this.tmpFormMessage || ""
			}

			axios.post(`/add`, trackInfo).then((response) => {
				let { status, data } = response.data
				if (typeof status === "string" && status === "OK") {
					this.playList.push(data)
					this.addTrack(data)
					
					// add for all user..
					this.socket.emit("add_new_track", data);
				}

				this.formClearSubmit()
				this.myModalSearch.hide()
			}).catch(error => {
				this.formClearSubmit()			
				this.myModalSearch.hide()
				console.log(error.message)
			})
		}
	},
};
</script>

<style>
	a:hover {
		cursor: pointer;
	}
	.thumbnail {
		background-color: rgb(0 0 0 / 13%);
		padding: 5px 2px;
		margin-bottom: 2px;
		border-left: 3px solid rgb(222 222 222);
	}
	.thumbnail::after {
		content: "";
		display: block;
		clear: both;
	}
	.thumbnail > a {
		float: left;
		width: 30%;
		overflow: hidden;
	}
	.thumbnail > div.caption {
		width: 70%;
		padding: 0.5rem;
		float: left;
	}
	.thumbnail.active_track {
		border-left: 3px solid green;
	}
	/* .thumbnail.control {
		text-align: center;
	} */
	.thumbnail.control .select-player {
		float: left;
    	padding: 4px 12px 0 5px;
	}
	.thumbnail .title {
		font-weight: 500;
	}
</style>
