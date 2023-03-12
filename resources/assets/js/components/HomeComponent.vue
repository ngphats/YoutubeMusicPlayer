<template>
  	<div>
		<button @click="play">Play</button>
		<button @click="add">Add</button>
		<button @click="tracks">Tracks</button>
  	</div>
</template>

<script>

import { socket } from "../socketio.service";

export default {
	data() {
		return {
			//
		};
	},
	mounted() {
	},
	methods: {
		create() {
			socket.emit("create", []);
		},
		disconnect() {
			socket.disconnect();
		},
		add() {
			playem.addTrackByUrl("https://www.youtube.com/watch?v=TxM33dm_v7o&ab_channel=LearnEnglishwithEnglishClass101.com");
		},
		play() {
			playem.play();
		},
		tracks() {
			let tracks = playem.getQueue()

			console.log({tracks})
		}
	},
};
</script>

<style></style>
