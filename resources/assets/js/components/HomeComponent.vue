<template>
	<div class="container">
		
		<div class="row justify-content-center">
			<div class="col-md-4">
				<button type="button" class="btn btn-primary" @click="play">Play</button>
				<button type="button" class="btn btn-primary" data-toggle="modal" data-target="#exampleModal" data-whatever="@getbootstrap">Add</button>
				<button type="button" class="btn btn-primary" @click="update">Update</button>
				<button type="button" class="btn btn-primary" @click="tracks">Tracks</button>
			</div>
		</div>

		<div class="row justify-content-center">
			<div class="col-md-4">
				<div v-for="track in playList" :key="track.id" class="thumbnail">
					<a href="#"><img src="https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg" style="width:100%"></a>
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
					<button type="button" class="close" data-dismiss="modal" aria-label="Close">
					<span aria-hidden="true">&times;</span>
					</button>
				</div>
				<div class="modal-body">
					<form>
					<div class="form-group">
						<label for="recipient-name" class="col-form-label">Link Youtube:</label>
						<input type="text" class="form-control" id="recipient-name">
					</div>
					<div class="form-group">
						<label for="message-text" class="col-form-label">Message:</label>
						<textarea class="form-control" id="message-text"></textarea>
					</div>
					</form>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
					<button type="button" class="btn btn-primary">Add</button>
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
			tmpFormMessage: "",
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
					this.playList = data
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
			if (this.tmpFormLink !== "" && this.tmpFormMessage !== "") {
				axios.post(`/add`, {
					link: this.tmpFormLink,
					message: this.tmpFormMessage,
				}).then((response) => {
					let { status, data } = response.data
					if (typeof status === "string" && status === "OK") {
						this.playList = data
					}
				})
			}
		},
		add() {
			axios.post(`/add`).then((response) => {
				console.log(response.data);
			})

			playem.addTrackByUrl("https://www.youtube.com/watch?v=TxM33dm_v7o");
		},
		play() {
			playem.play();
		},
		tracks() {
			let tracks = playem.getQueue()

			console.log({tracks})
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
		width: 100px;
		overflow: hidden;
	}
	.thumbnail > div.caption {
		padding: 0.5rem;
		float: left;
	}
</style>
