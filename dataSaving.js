const fileUtils = require('../fonbet_live_watcher/src/fileTools');

exports.writeParsedEventToCSV = function writeParsedEventToCSV(parsedEvent, fileName) {
    let scoreInfo = parsedEvent.score;
    let csvRow = [
        parsedEvent.startDateTime.toLocaleDateString(),
        parsedEvent.startDateTime.toLocaleTimeString(),
        parsedEvent.originalName,
        scoreInfo.firstTime ? `'${scoreInfo.firstTime[0]} - ${scoreInfo.firstTime[1]}` : '',
        parsedEvent.firstGoal.time ? parsedEvent.firstGoal.time : '',
        parsedEvent.firstGoalTeamName,
        `'${scoreInfo.totals[0]} - ${scoreInfo.totals[1]}`,
    ];
    fileUtils.appendFile(`${fileName}.csv`, csvRow.join(';'), true);
};
