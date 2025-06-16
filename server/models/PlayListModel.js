
const admin = require('firebase-admin');

// Check if Firebase is initialized
let db = null;
let isFirebaseAvailable = false;

try {
    db = admin.firestore();
    isFirebaseAvailable = true;
} catch (error) {
    console.warn('Firebase not available in PlayListModel');
}

// Mock data store when Firebase is not available
let mockPlaylist = [];

const PlayListModel = {};

PlayListModel.getAll = async () => {
    if (!isFirebaseAvailable) {
        return mockPlaylist;
    }
    
    let docRef = db.collection(`koi-streaming`)
    const uploadQueueInfo = await docRef.orderBy('add_datetime').get()
    if (uploadQueueInfo.empty) {
        return []
    }

    let result = []
    uploadQueueInfo.forEach(doc => {
        let fileInfo = doc.data()
        fileInfo.id = doc.id
        result.push(fileInfo)
    })

    return result
}

PlayListModel.add = async (data) => {
    if (!isFirebaseAvailable) {
        data.id = 'mock_' + Date.now();
        mockPlaylist.push(data);
        return true;
    }
    
    let docRef = db.collection(`koi-streaming`).doc()
    await docRef.set(data)

    return true
}

PlayListModel.update = async (ID, data) => {
    if (!isFirebaseAvailable) {
        const index = mockPlaylist.findIndex(item => item.id === ID);
        if (index !== -1) {
            mockPlaylist[index] = { ...mockPlaylist[index], ...data };
        }
        return true;
    }
    
    let docRef = db.collection(`koi-streaming`).doc(ID)
    await docRef.update(data)

    return true
}


module.exports = PlayListModel;
