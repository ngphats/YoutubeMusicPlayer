<template>
	<div class="container">
		
		<div class="row justify-content-center mb-4">
			<div class="col-md-8">
				<div class="card">
					<div class="card-body">
						<div class="input-group">
							<input type="text" class="form-control form-control-lg" @click="onSearch" placeholder="🔍 Search for music..." readonly/>
							<button class="btn btn-primary" type="button" @click="onSearch">
								<i class="fas fa-search"></i> Search
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="row justify-content-center mb-4">
			<div class="col-md-8">
				<div class="card">
					<div class="card-header">
						<h5 class="card-title mb-0">🎵 Player Controls</h5>
					</div>
					<div class="card-body">
						<div class="row align-items-center">
							<div class="col-md-6 mb-3 mb-md-0">
								<label class="form-label">Select Device:</label>
								<select class="form-select" v-model="player_selected">
									<option v-for="option in list_player_active" :key="option.socket_id" :value="option.socket_id">
										{{ option.socket_id === socket.id ? "📱 This Device" : "🖥️ " + option.player_ip }}
									</option>
								</select>
							</div>
							<div class="col-md-6">
								<div class="d-grid gap-2 d-md-flex justify-content-md-end">
									<button type="button" class="btn btn-success btn-sm" @click="play()">
										<i class="fas fa-play"></i> Play
									</button>
									<button type="button" class="btn btn-info btn-sm" @click="next">
										<i class="fas fa-step-forward"></i> Next
									</button>
									<button type="button" class="btn btn-danger btn-sm" @click="stop">
										<i class="fas fa-stop"></i> Stop
									</button>
									<button type="button" class="btn btn-primary btn-sm" @click="add">
										<i class="fas fa-plus"></i> Add
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="row justify-content-center">
			<div class="col-md-8">
				<div class="card">
					<div class="card-header">
						<h5 class="card-title mb-0">🎶 Playlist ({{ playList.length }} songs)</h5>
					</div>
					<div class="card-body p-0">
						<div v-if="playList.length === 0" class="p-4 text-center text-muted">
							<i class="fas fa-music fa-3x mb-3"></i>
							<p>No songs in playlist. Add some music to get started!</p>
						</div>
						<div v-for="(track, index) in playList" :key="track.id" :class="{ 'song-item': true, 'active-song': track.ytid == activeTrack }">
							<div class="d-flex align-items-center p-3">
								<div class="flex-shrink-0">
									<img :src="track.thumbnail" class="song-thumbnail" @click="playTrack(track.ytid)" style="cursor: pointer;">
									<div class="song-number">{{ index + 1 }}</div>
								</div>
								<div class="flex-grow-1 ms-3">
									<h6 class="song-title mb-1" @click="playTrack(track.ytid)" style="cursor: pointer;">{{ track.title }}</h6>
									<p class="song-message mb-0 text-muted">{{ track.message || 'No message' }}</p>
									<small class="text-muted">Added: {{ formatDate(track.add_datetime) }}</small>
								</div>
								<div class="flex-shrink-0">
									<button class="btn btn-sm btn-outline-primary" @click="playTrack(track.ytid)">
										<i class="fas fa-play"></i>
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
			<div class="modal fade" id="modalAdd" tabindex="-1" aria-labelledby="modalAddLabel" aria-hidden="true">
			<div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title" id="modalAddLabel">🎵 Add New Song</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" @click="formClearSubmit"></button>
					</div>
					<div class="modal-body">
						<form>
							<div class="mb-3">
								<label for="recipient-name" class="form-label">YouTube URL:</label>
								<div class="input-group">
									<span class="input-group-text">🔗</span>
									<input type="text" class="form-control" id="recipient-name" v-model="tmpFormLink" placeholder="https://www.youtube.com/watch?v=...">
								</div>
								<div class="invalid-feedback d-block" v-show="errorTmpFormLink.length > 0">
									{{errorTmpFormLink}}
								</div>
							</div>
							
							<div class="mb-3">
								<label for="message-text" class="form-label">Message (optional):</label>
								<div class="input-group">
									<span class="input-group-text">💬</span>
									<textarea class="form-control" id="message-text" v-model="tmpFormMessage" rows="2" placeholder="Add a message for this song..."></textarea>
								</div>
							</div>
						</form>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" data-bs-dismiss="modal" @click="formClearSubmit">
							<i class="fas fa-times"></i> Cancel
						</button>
						<button type="button" class="btn btn-primary" @click="formAddSubmit">
							<i class="fas fa-plus"></i> Add Song
						</button>
					</div>
				</div>
			</div>
		</div>

		<div class="modal fade" id="modalSearch" tabindex="-1" aria-labelledby="modalSearchLabel" aria-hidden="true">
			<div class="modal-dialog modal-dialog-scrollable modal-lg">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title">🔍 Search Music</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" @click="formClearSubmit"></button>
					</div>
					<div class="modal-body">
						<div class="mb-3">
							<div class="input-group">
								<span class="input-group-text">🎵</span>
								<input type="text" class="form-control form-control-lg" id="search-key" v-model="search_key" @input="searchTyping" placeholder="Search for songs, artists, or videos...">
							</div>
						</div>
						
						<div class="search-results" style="min-height: 400px;">
							<!-- Loading indicator -->
							<div v-if="isSearching" class="text-center p-5">
								<div class="spinner-border text-primary" role="status">
									<span class="visually-hidden">Loading...</span>
								</div>
								<p class="mt-3 text-muted">Đang tìm kiếm nhạc...</p>
							</div>
							
							<!-- No results states -->
							<div v-else-if="searchResultList.length === 0 && search_key.length > 0" class="text-center p-5 text-muted">
								<i class="fas fa-search fa-3x mb-3"></i>
								<p>No results found. Try different keywords.</p>
							</div>
							<div v-else-if="searchResultList.length === 0" class="text-center p-5 text-muted">
								<i class="fas fa-music fa-3x mb-3"></i>
								<p>Start typing to search for music...</p>
							</div>
							
							<!-- Search results -->
							<div v-for="track in searchResultList" :key="track.id" class="search-result-item mb-3">
								<div class="card h-100">
									<div class="row g-0">
										<div class="col-md-4">
											<img :src="track.img" class="img-fluid rounded-start h-100" style="object-fit: cover;">
										</div>
										<div class="col-md-8">
											<div class="card-body">
												<h6 class="card-title">{{ track.title }}</h6>
												<p class="card-text text-muted small">{{ track.message || 'No description' }}</p>
												<div class="d-grid">
													<button class="btn btn-primary btn-sm" @click="chooseTrack(track)">
														<i class="fas fa-plus"></i> Add to Playlist
													</button>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
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
			searchResultList: [],
			isSearching: false
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

			console.log(`update..`)

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
								
								// Add for all user..
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
			this.isSearching = false
		},
		search() {
			let keySearch = this.search_key
			if (keySearch.length == 0) {
				this.isSearching = false
				return
			}

			this.searchResultList = []
			this.isSearching = true

			this.playem.searchTracks(keySearch, (item) => {
				if (undefined == item) {
					this.isSearching = false
					return
				}

				this.searchResultList.push(item)
				
				// Set loading to false after first result to indicate search is working
				if (this.searchResultList.length === 1) {
					this.isSearching = false
				}
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
			// Reset loading if user is typing quickly
			if (this.search_key.length === 0) {
				this.isSearching = false
				this.searchResultList = []
			}
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
		},
		formatDate(dateString) {
			if (!dateString) return 'Unknown';
			try {
				const date = new Date(dateString);
				return date.toLocaleDateString('vi-VN', {
					year: 'numeric',
					month: 'short',
					day: 'numeric',
					hour: '2-digit',
					minute: '2-digit'
				});
			} catch (e) {
				return 'Unknown';
			}
		}
	},
};
</script>

<style>
	/* Custom styles for improved UX */
	.song-item {
		border-bottom: 1px solid #e9ecef;
		transition: background-color 0.2s ease;
	}
	
	.song-item:hover {
		background-color: #f8f9fa;
	}
	
	.song-item.active-song {
		background-color: #e7f3ff;
		border-left: 4px solid #0d6efd;
	}
	
	.song-thumbnail {
		width: 80px;
		height: 60px;
		object-fit: cover;
		border-radius: 8px;
		position: relative;
	}
	
	.song-number {
		position: absolute;
		top: -10px;
		left: -10px;
		background: #0d6efd;
		color: white;
		border-radius: 50%;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 12px;
		font-weight: bold;
	}
	
	.song-title {
		color: #333;
		font-weight: 600;
		line-height: 1.4;
	}
	
	.song-title:hover {
		color: #0d6efd;
	}
	
	.song-message {
		font-size: 0.9em;
		line-height: 1.3;
	}
	
	.card {
		border: none;
		box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
		border-radius: 0.5rem;
	}
	
	.card-header {
		background-color: #f8f9fa;
		border-bottom: 1px solid #dee2e6;
		border-radius: 0.5rem 0.5rem 0 0 !important;
	}
	
	.btn {
		border-radius: 0.375rem;
		font-weight: 500;
	}
	
	.form-control, .form-select {
		border-radius: 0.375rem;
	}
	
	/* Legacy styles for backward compatibility */
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
	.thumbnail.control .select-player {
		float: left;
    	padding: 4px 12px 0 5px;
	}
	.thumbnail .title {
		font-weight: 500;
	}
</style>
