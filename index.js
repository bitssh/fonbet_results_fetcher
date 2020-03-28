const {parseSectionEvents} = require("./responseParsing");
const {parseSections} = require("./responseParsing");
const {writeParsedEventToCSV} = require("./dataSaving");
const {fetcher} = require("./dataFetching");

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
                    for (let event of section.parsedEvents) {
                        writeParsedEventToCSV(event, section.shortName);
                    }
                }
            }
            date.setDate(date.getDate() + 1);
        }
    } catch (err) {
        console.error(err.message);
    }
})();
