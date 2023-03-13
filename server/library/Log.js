const fs = require('fs');
const util = require('util');
const dateFormat = require('dateformat');
const tmpFolderLog = __dirname + "/../../tmp/logs";

const Log = {};

Log.getLogPath = (logName, dir='') => {
	let dateNow = new Date();
	let fileLogPath = tmpFolderLog + "/" + logName + "_" + dateFormat(dateNow, "yyyymmddHH") + ".log";
	if(dir) {
		fileLogPath = tmpFolderLog + "/" + dir + '/' + logName + "_" + dateFormat(dateNow, "yyyymmddHH") + ".log";
	}
	return fs.createWriteStream(fileLogPath, {
		flags: 'a'
	});
}

Log.debug = (logName, d, dir='') => {
	return new Promise(async (resolve, reject) => {
		if (null === logName || null === d) {
			throw new Error("Write log need two params.");
		}

		let logFilePath = Log.getLogPath(logName, dir);
		let dateNow = new Date();
		let nowLogTime = "[" + dateFormat(dateNow, "yyyy-mm-dd HH:MM:ss") + "] ";

		logFilePath.write(util.format(nowLogTime) + JSON.stringify(d, null, 4) + '\n');
		logFilePath.end();

		resolve(true);
	});
};

module.exports = Log;