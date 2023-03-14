let events = (io) => {
    io.on('connection', (socket) => {
        console.log(`New client connected: ${socket.request.connection.remoteAddress}`);
        let {id} = socket
        console.log({id})
        
        socket.on('disconnect', () => {
            console.log('disconnected')
        })

        socket.on('hello', data => {
            socket.broadcast.emit('message-test1', { text: 'From broadcast: Hello world' })
        })

        socket.on('add_new_track', data => {
            socket.broadcast.emit('add_new_track', data)
        })
    })
}

module.exports = {
    events
}