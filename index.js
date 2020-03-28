const {parseSectionEvents} = require("./responseParsing");
const {parseSections} = require("./responseParsing");
const {fetcher} = require("./dataFetching");
const{appendLinesToFile} = require('../fonbet_live_watcher/src/fileTools');

const START_DATE = '2018-03-01';

console.log('initialized');
(async () => {
    let date = new Date(START_DATE);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    let response;
    try {
        while (date < today) {
            const url = await fetcher.getApiUrl(date);
            try {
                response = await fetcher.fetch(url);
            } catch (e) {
                console.error(e.message);
                continue;
            }
            let results = JSON.parse(await response.text());
            let sections = parseSections(results);
            if (sections) {
                for (let section of sections) {
                    section.parsedEvents = parseSectionEvents(section);
                }
                for (let section of sections) {
                    let csvRows = section.parsedEvents.map(event => event.asCsvRow);
                    appendLinesToFile(`${section.shortName}.csv`, csvRows, true);
                }
            }
            date.setDate(date.getDate() + 1);
        }
    } catch (err) {
        console.error(err.message);
    }
})();
