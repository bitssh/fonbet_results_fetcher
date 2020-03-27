const {parseSectionEvents} = require("./responseParsing");
const {parseSections} = require("./responseParsing");
const {saveParsedEvent} = require("./dataSaving");
const {fetcher} = require("./dataFetching");

console.log('initialized');

(async () => {
    let date = new Date('2018-08-01');
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    while (date < today) {
        try {
            const url = await fetcher.getApiUrl(date);
            let results = await fetcher.fetchResults(url);
            let sections = parseSections(results);
            if (sections) {
                for (let section of sections ) {
                    section.parsedEvents = parseSectionEvents(section);
                }

                for (let section of sections ) {
                    for (let event of section.parsedEvents ) {
                        saveParsedEvent(event);
                    }
                }
            }

        } catch (err) {
            console.error(err.message);
        }

        date.setDate(date.getDate() + 1);
    }


})();
