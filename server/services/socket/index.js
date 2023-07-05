let events = (io, dbAdmin) => {

    let lsPlayerActive = []

    const randomeName = [
        {
            "id": 1,
            "name": "Chồn hôi",
            "color": "#1abc9c"
        }, {
            "id": 2,
            "name": "Hải cẩu",
            "color": "#2ecc71"
        }, {
            "id": 3,
            "name": "Gấu Bắc Cực",
            "color": "#3498db"
        }, {
            "id": 4,
            "name": "Ếch xanh",
            "color": "#8e44ad"
        }, {
            "id": 5,
            "name": "Chó đốm",
            "color": "#2c3e50"
        }, {
            "id": 6,
            "name": "Sư tử",
            "color": "#f1c40f"
        }, {
            "id": 7,
            "name": "Báo đốm",
            "color": "#e67e22"
        }, {
            "id": 8,
            "name": "Khỉ",
            "color": "#e74c3c"
        }, {
            "id": 9,
            "name": "Voọc",
            "color": "#95a5a6"
        }, {
            "id": 10,
            "name": "Chích chòe",
            "color": "#d35400"
        }, {
            "id": 11,
            "name": "Gấu trúc",
            "color": "#f39c12"
        }, {
            "id": 12,
            "name": "Sói tuyết",
            "color": "#16a085"
        }, {
            "id": 13,
            "name": "Sói xám",
            "color": "#34495e"
        }, {
            "id": 14,
            "name": "Thỏ trắng",
            "color": "#27ae60"
        }, {
            "id": 15,
            "name": "Chim cánh cụt",
            "color": "#9b59b6"
        }, {
            "id": 16,
            "name": "Cừu",
            "color": "#674172"
        }, {
            "id": 17,
            "name": "Cá heo",
            "color": "#F5D76E"
        }
    ]

    io.on('connection', (socket) => {
        socket.on('player_active', () => {
            // console.log(`Player active`);
            // console.log(`IP: ${socket.request.connection.remoteAddress}`);
            // console.log(`SocketID: ${socket.id}`)
            lsPlayerActive.push({
                socket_id: socket.id,
                player_ip: socket.request.connection.remoteAddress,
                player_name: `Sói hoang ` + socket.id
            })

            io.sockets.emit('list_player_active', lsPlayerActive)
        })

        socket.on('disconnect', () => {
            // Remove active player
            lsPlayerActive = lsPlayerActive.filter(item => item.socket_id !== socket.id)
            io.sockets.emit('list_player_active', lsPlayerActive)
        })

        socket.on('hello', data => {
            socket.broadcast.emit('message-test1', { text: 'From broadcast: Hello world' })
        })

        socket.on('add_new_track', data => {
            socket.broadcast.emit('add_new_track', data)
        })

        socket.on('play', data => {
            io.to(data.player_selected).emit('play', { track_idx: data.track_idx})
        })

        socket.on('on_track_change', params => {
            socket.broadcast.emit('on_track_change', params)
        })
        
        socket.on('on_device_change', params => {
            socket.broadcast.emit('on_track_change', params)
        })
    })
}

module.exports = {
    events
}