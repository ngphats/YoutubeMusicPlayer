const fs = require('fs');
const util = require('util');
const dateFormat = require('dateformat');
const tmpFolderLog = __dirname + "/../../tmp/logs";

const Log = {};

// Cache for open file streams to avoid creating new streams on every log call
const fileStreamCache = new Map();
const STREAM_CACHE_TTL = 60000; // 1 minute TTL for cached streams
let cleanupInterval = null; // Store cleanup interval reference

Log.getLogPath = (logName, dir='') => {
	let dateNow = new Date();
	let fileLogName = logName + "_" + dateFormat(dateNow, "yyyymmddHH") + ".log";
	let fileLogPath = dir 
		? tmpFolderLog + "/" + dir + '/' + fileLogName
		: tmpFolderLog + "/" + fileLogName;
	
	// Check if we have a cached stream for this file
	const cacheKey = fileLogPath;
	const cachedEntry = fileStreamCache.get(cacheKey);
	
	if (cachedEntry && cachedEntry.stream && !cachedEntry.stream.destroyed) {
		// Update last access time
		cachedEntry.lastAccess = Date.now();
		return cachedEntry.stream;
	}
	
	// Create new stream
	const stream = fs.createWriteStream(fileLogPath, { flags: 'a' });
	
	// Cache the stream
	fileStreamCache.set(cacheKey, {
		stream: stream,
		lastAccess: Date.now()
	});
	
	// Set up periodic cleanup only once
	if (!cleanupInterval) {
		cleanupInterval = setInterval(() => {
			const now = Date.now();
			for (const [key, entry] of fileStreamCache.entries()) {
				if (now - entry.lastAccess > STREAM_CACHE_TTL) {
					if (entry.stream && !entry.stream.destroyed) {
						entry.stream.end();
					}
					fileStreamCache.delete(key);
				}
			}
		}, STREAM_CACHE_TTL);
	}
	
	return stream;
}

Log.debug = (logName, d, dir='') => {
	return new Promise(async (resolve, reject) => {
		if (null === logName || null === d) {
			throw new Error("Write log need two params.");
		}

		let logFilePath = Log.getLogPath(logName, dir);
		let dateNow = new Date();
		let nowLogTime = "[" + dateFormat(dateNow, "yyyy-mm-dd HH:MM:ss") + "] ";

		// Use write without ending the stream (stream will be reused)
		logFilePath.write(util.format(nowLogTime) + JSON.stringify(d, null, 4) + '\n');

		resolve(true);
	});
};

module.exports = Log;