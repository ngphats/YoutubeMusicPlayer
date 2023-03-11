<template>
  <div class="pt-150 pb-150">
    <div class="container">
      <div class="row">
        <div class="col-lg-8">
          <ul id="play-list">
            <li class="active">
              <button
                type="button"
                class="list-btn"
                data-src="https://www.youtube.com/embed/a0glBQXOcl4"
              >
                <img src="images/v1.jpg" alt="image" />
                <span>Video - 1</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                class="list-btn"
                data-src="https://www.youtube.com/embed/oluY633rkgI"
              >
                <img src="images/v2.jpg" alt="image" />
                <span>Video - 2</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                class="list-btn"
                data-src="https://www.youtube.com/embed/Y03fZpZK5fY"
              >
                <img src="images/v3.jpg" alt="image" />
                <span>Video - 3</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                class="list-btn"
                data-src="https://www.youtube.com/embed/mU6anWqZJcc"
              >
                <img src="images/v4.jpg" alt="image" />
                <span>Video - 4</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                class="list-btn"
                data-src="https://www.youtube.com/embed/aNu000cQZmU"
              >
                <img src="images/v5.jpg" alt="image" />
                <span>Video - 5</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                class="list-btn"
                data-src="https://www.youtube.com/embed/iLEr67qVHrg"
              >
                <img src="images/v6.jpg" alt="image" />
                <span>Video - 6</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                class="list-btn"
                data-src="https://www.youtube.com/embed/BmKXBVdEV0g"
              >
                <img src="images/v7.jpg" alt="image" />
                <span>Video - 7</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                class="list-btn"
                data-src="https://www.youtube.com/embed/Ib8UBwu3yGA"
              >
                <img src="images/v8.jpg" alt="image" />
                <span>Video - 8</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                class="list-btn"
                data-src="https://www.youtube.com/embed/iogabydg2y0"
              >
                <img src="images/v9.jpg" alt="image" />
                <span>Video - 9</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                class="list-btn"
                data-src="https://www.youtube.com/embed/P5QcZ3CtzGc"
              >
                <img src="images/v10.jpg" alt="image" />
                <span>Video - 10</span>
              </button>
            </li>
          </ul>
          <!-- play-list end -->
        </div>
      </div>
    </div>

  <button @click="connect()">Connect</button>
  <button @click="disconnect()">Disconnect</button>

  </div>
</template>

<script>

import { socket } from "../socketio.service";

export default {
  name: "App",
  components: {},
  methods: {
    connect() {
      socket.emit("create", {b:1});
    },
    disconnect() {
      socket.disconnect();
    }
  }

};
</script>

<style>
#video-wrapper {
  width: 100%;
  height: 415px;
}
#play-list {
  background-color: #ffffff;
  max-height: 415px;
  overflow-y: scroll;
  box-shadow: 0 0px 15px rgba(0, 0, 0, 0.2);
  counter-reset: listCounter;
}
#play-list button {
  background-color: transparent;
  padding: 15px 15px 15px 30px;
}
#play-list li {
  position: relative;
}
#play-list li.active {
  background-color: #d022222e;
}
#play-list li.active::before {
  font-family: "Font Awesome 5 Free";
  font-weight: 900;
  content: "\f04b";
  color: #ff0000;
}
#play-list li + li {
  border-top: 1px solid #cccccc;
}
#play-list li::before {
  position: absolute;
  counter-increment: listCounter;
  content: counter(listCounter);
  top: 50%;
  left: 10px;
  margin-top: -12px;
}
#play-list li button {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -ms-flex-wrap: wrap;
  flex-wrap: wrap;
  width: 100%;
  align-items: center;
}
#play-list li img {
  width: 80px;
  position: relative;
}
#play-list li img::after {
  position: absolute;
  content: "";
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #000000;
}
#play-list li span {
  width: calc(100% - 80px);
  padding-left: 15px;
  text-align: left;
  font-weight: 700;
}

/*------scroll bar
if you want to use custom scroll bar using CSS
 , you must use ID for selecting.... (class selector doesn't work)
---------------------*/

#play-list::-webkit-scrollbar {
  width: 5px;
  height: 7px;
}
#play-list::-webkit-scrollbar-button {
  width: 0px;
  height: 0px;
}
#play-list::-webkit-scrollbar-thumb {
  background: #525965;
  border: 0px none #ffffff;
  border-radius: 0px;
}
#play-list::-webkit-scrollbar-thumb:hover {
  background: #525965;
}
#play-list::-webkit-scrollbar-thumb:active {
  background: #525965;
}
#play-list::-webkit-scrollbar-track {
  background: transparent;
  border: 0px none #ffffff;
  border-radius: 50px;
}
#play-list::-webkit-scrollbar-track:hover {
  background: transparent;
}
#play-list::-webkit-scrollbar-track:active {
  background: transparent;
}
#play-list::-webkit-scrollbar-corner {
  background: transparent;
}
</style>
