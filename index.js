const {parseSectionEvents} = require("./responseParsing");
const {parseSections} = require("./responseParsing");
const {fetcher} = require("./dataFetching");
const{appendLinesToFile} = require('../fonbet_live_watcher/src/fileTools');
const moment = require("moment");

const FETCH_FROM_DATE = '2018-03-01';
const EVENTS_START_HOUR = 8;

(async () => {
    console.log('initialized');
    let date = moment(FETCH_FROM_DATE).startOf('day');
    const today = moment().startOf('day');
    try {
        while (date < today) {
            const url = await fetcher.getApiUrl(date);
            let response;
            try {
                response = await fetcher.fetch(url);
            } catch (e) {
                console.error(e.message);
                continue;
            }
            let results = JSON.parse(await response.text());
            let sections = parseSections(results);
            if (sections) {
                let tomorrowEventsStartMoment = moment(date).add(1, 'day').set('hour', EVENTS_START_HOUR);
                for (let section of sections) {
                    section.parsedEvents = parseSectionEvents(section).filter(event => {
                        return event.startMoment.isBefore(tomorrowEventsStartMoment);
                    });
                }
                for (let section of sections) {
                    let csvRows = section.parsedEvents.map(event => event.asCsvRow);
                    appendLinesToFile(`${section.shortName}.csv`, csvRows, true);
                }
            }
            date.add(1, 'day');
        }
    } catch (err) {
        console.error(err.message);
    }
})();
