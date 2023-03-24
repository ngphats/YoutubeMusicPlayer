<template>
	<div class="container">

		<div class="row justify-content-center">
			<div class="col-md-6">
				<div :class="{ thumbnail: true, control: true }">
					
					<div class="select-player">
						<select class="form-select" aria-label="Default select example" disabled>
							<option value="0">This Device</option>
							<option value="1">192.168.1.112</option>
						</select>
					</div>

					<div class="control-player">
						<button type="button" class="btn btn-primary btn-sm" @click="play()">Play</button>
						<button type="button" class="btn btn-primary btn-sm" @click="next">Next</button>
						<button type="button" class="btn btn-primary btn-sm" @click="add">Add</button>

						<button type="button" class="btn btn-primary btn-sm" @click="tracks">Debug</button>
					</div>
				</div>
			</div>
		</div>

		<div class="row justify-content-center">
			<div class="col-md-6">
				<div v-for="track in playList" :key="track.id" :class="{ thumbnail: true, active_track: track.ytid == activeTrack }">
					<a @click="playTrack(track.ytid)"><img :src="track.thumbnail" style="width:100%"></a>
					<div class="caption">
						<h6>{{ track.title }}</h6>
						<p>{{ track.message }}</p>
					</div>
				</div>
			</div>
		</div>
		
		<div class="modal fade" id="exampleModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
			<div class="modal-dialog" role="document">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title" id="exampleModalLabel">Add</h5>
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

	</div>
</template>

<script>

import io from 'socket.io-client'

export default {
	data() {
		return {
			socketID: "",
			socket: {},
			playList: [],
			tmpFormLink: "",
			errorTmpFormLink: "",
			tmpFormMessage: "",
			myModal: {},
			playem: {},
			activeTrack: "",
			listPlayerActive: []
		};
	},
	created() {
		this.socket = io(serverURL, {
			autoConnect: true
		})

		this.socket.on('connect', () => {
			console.log(this.socket)
			this.socket.emit("player_active")
		})

		this.socket.on('list_player_active', data => {
			console.log({data})
		})

        this.socket.on('add_new_track', data => {
			this.addTrack(data)
			this.playList.push(data)
		})

        this.socket.on('player_connect', data => {
			console.log({data})
		})

        this.socket.on('player_disconnect', data => {
			console.log({data})
		})

		// init playem and players
		this.playem = new Playem();
		this.playem.addPlayer(YoutubePlayer, {
			playerContainer: document.getElementById("playem_video"),
		})

		this.playem.on("onTrackChange", (data) => {
			this.activeTrack = data.trackId
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
						this.myModal.hide()
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
		},
		add() {
			if (Object.keys(this.myModal).length === 0) {
				this.myModal = new bootstrap.Modal(document.getElementById('exampleModal'), {
					keyboard: false
				})
			}

			this.myModal.show()
		},
		addTrack(track) {
			this.playem.addTrackByUrl(track.url)
		},
		play(ind) {
			this.playem.play(ind);
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
			let selectTrack = "_3-uD0PvM7g"
			let snoop = '_Rks2oCRS88'

			// let tracks = this.playem.getQueue()
			let tracks = this.playem.searchTracks(snoop, (item) => {
				console.log(item)
			})

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
</style>
