<template>
	<div class="container">
		
		<div class="row justify-content-center">
			<div class="col-md-4">
				<button type="button" class="btn btn-primary" @click="play">Play</button>
				<button type="button" class="btn btn-primary" @click="pause">Pause</button>
				<button type="button" class="btn btn-primary" @click="next">Next</button>
				<button type="button" class="btn btn-primary" @click="add">Add</button>
			</div>
		</div>

		<div class="row justify-content-center">
			<div class="col-md-6">
				<div v-for="track in playList" :key="track.id" class="thumbnail">
					<a href=""><img :src="track.thumbnail" style="width:100%"></a>
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
						<label for="recipient-name" class="col-form-label">Link Youtube:</label>
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

import { socket } from "../socketio.service";

export default {
	data() {
		return {
			playList: [],
			tmpFormLink: "",
			errorTmpFormLink: "",
			tmpFormMessage: "",
			myModal: {}
		};
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
			socket.emit("create", []);
		},
		disconnect() {
			socket.disconnect();
		},
		formAddSubmit() {
			if (null !== this.tmpFormLink && this.tmpFormLink.length > 0) {
				playem.getTrackInfo(this.tmpFormLink, (item) => {
					if (undefined === item) {
						this.errorTmpFormLink = "Không tìm thấy video, vui lòng kiểm tra lại link."
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
							
							console.log({ status, data })
							
							if (typeof status === "string" && status === "OK") {
								this.playList.push(data)

								this.addTrack(data)
							}
						})

						this.formClearSubmit()
						this.myModal.hide()
					}
				})
			} else {
				this.errorTmpFormLink = "Mời bạn nhập link."
			}
		},
		formClearSubmit() {			
			this.tmpFormLink = ""
			this.errorTmpFormLink = ""
			this.tmpFormMessage = ""
		},
		add() {
			this.myModal = new bootstrap.Modal(document.getElementById('exampleModal'), {
				keyboard: false
			})

			this.myModal.show()
		},
		addTrack(track) {
			playem.addTrackByUrl(track.url)
		},
		play() {
			playem.play();
		},
		tracks() {
			let tracks = playem.getQueue()
		},
		next() {
			playem.next();
		},
		pause() {
			playem.pause();
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
	.thumbnail {
		background-color: rgb(0 0 0 / 13%);
		padding: 5px;
		margin-bottom: 2px;
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
</style>
