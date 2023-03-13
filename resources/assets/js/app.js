import Vue from "vue";

window.axios = require("axios");

import "bootstrap/dist/css/bootstrap.css";

import HomeComponent from "./components/HomeComponent.vue";

const app = new Vue({
  el: "#app",
  render: (h) => h(HomeComponent),
});