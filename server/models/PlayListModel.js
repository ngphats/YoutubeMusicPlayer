
const admin = require('firebase-admin');
const db = admin.firestore();

const PlayListModel = {};

PlayListModel.getAll = async () => {
    let docRef = db.collection(`koi-streaming`)
    const uploadQueueInfo = await docRef.get()
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
    let docRef = db.collection(`koi-streaming`).doc()
    await docRef.set(data)

    return true
}

PlayListModel.update = async (ID, data) => {
    let docRef = db.collection(`koi-streaming`).doc(ID)
    await docRef.update(data)

    return true
}


module.exports = PlayListModel;
