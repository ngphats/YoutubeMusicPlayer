let events = (io, dbAdmin) => {

    let lsPlayerActive = []

    io.on('connection', (socket) => {
        socket.on('player_active', () => {
            console.log(`Player active`);
            console.log(`IP: ${socket.request.connection.remoteAddress}`);
            console.log(`SocketID: ${socket.id}`)

            lsPlayerActive.push({
                socket_id: socket.id,
                player_ip: socket.request.connection.remoteAddress,
                player_name: `Sói hoang ` + socket.id
            })

            socket.broadcast.emit('list_player_active', lsPlayerActive)
        })

        socket.on('disconnect', () => {
            console.log(`Player disconnected`);
            console.log(`IP: ${socket.request.connection.remoteAddress}`);
            console.log(`SocketID: ${socket.id}`)

            // console.log('disconnected')
        })

        socket.on('hello', data => {
            socket.broadcast.emit('message-test1', { text: 'From broadcast: Hello world' })
        })

        socket.on('add_new_track', data => {
            socket.broadcast.emit('add_new_track', data)
        })

        /*
        console.log(`Firebase listen..`)
        const collectionRef = dbAdmin.collection('koi-streaming')
        collectionRef.onSnapshot((querySnapshot) => {
            querySnapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const docData = change.doc.data()
                    console.log('document added:', docData)
                    io.sockets.emit('add_new_track', docData)
                }
    
                if (change.type === 'modified') {
                    const docData = change.doc.data();
                    console.log('document modified:', docData);
                    socket.broadcast.emit('add_new_track', docData)
                }
    
                if (change.type === 'removed') {
                    const docData = change.doc.data();
                    console.log('document removed:', docData);
                }
            });
        });
        */
    })
}

module.exports = {
    events
}