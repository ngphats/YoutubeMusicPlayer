let events = (io) => {
    io.on('connection', (socket) => {
        console.log('connected')
        
        socket.on('disconnect', () => {
            console.log('disconnected')
        })

        socket.on('create', data => {
            console.log({data})
        })
    })
}

module.exports = {
    events
}