console.log('initialized');
const fetch = require('node-fetch');
const _ = require('lodash');
const fileUtils = require('../fonbet_live_watcher/src/fileTools');
const {EventParser} = require("./EventParser");

const fonbetDomainUrl = 'https://www.fonbet.ru';
const filterSportMatching = 'Киберфутбол';
const filterSectionsContaining = ['Евролига', 'Мировая лига', 'Лига Про', 'Серия дерби'];

fonbetResults = {
    apiUrls: [],
    sportId: null,

    async getApiUrl(date) {
        const urlParams = new URLSearchParams({
            locale: 'ru',
            lastUpdate: 0,
            _: Date.now(),
            lineDate: date.toISOString().split('T')[0],
        });
        return `${await this.getRandomUrl()}/results/results.json.php?${urlParams}`
    },

    async getRandomUrl () {
        if (_.isEmpty(this.apiUrls)) {
            const response = await fetch(`${fonbetDomainUrl}/urls.json`);
            let { common: apiUrls } = await response.json();
            this.apiUrls = apiUrls.map(url => `https:${url}`);
        }
        return _.sample(this.apiUrls);
    },
    async fetchResults (url) {
        console.log(`fetching ${url}`);
        let response = await fetch(url);
        if (!response.ok) {
            console.error(`${new Date().toLocaleString()} ${response.status} - ${await response.text()}`);
            return;
        }
        return JSON.parse(await response.text());
    },
    /**
     * @param {Array} resultsResponseData.sports
     * @param {Array <{sport: string, name: string, events: Array<number>}>} resultsResponseData.sections
     * @param {Array <{id: string}>} resultsResponseData.events
     */
    parseSectionEvents (resultsResponseData) {
        if (!this.sportId) {
            const sport = resultsResponseData.sports.find(sport => sport.name === filterSportMatching);
            if (!sport) {
                console.error('Fetched data', resultsResponseData);
                throw new Error(`Not found sport name "${filterSectionsContaining}"`);
            }
            this.sportId = sport.id;
        }

        let sections = resultsResponseData.sections.filter(section => section.sport === String(this.sportId));
        sections = sections.filter(section => filterSectionsContaining.some(item => {
            const result = section.name.includes(item);
            if (result) {
                section.shortName = item;
            }
            return result;
        }));
        sections.forEach((section) => {
            section.events = section.events.map(eventId => resultsResponseData.events.find(
                event => event.id === String(eventId)));
        });

        return sections;
    },
    /**
     * @param {string} section.shortName
     * @param {string} section.shortName
     * @param {Array <{id: string, startTime: number, name: string, score: string, comment3: string}>} section.events
     */
    saveSectionEvents(section) {
        section.events.forEach((event) => {

            let startDateTime = new Date(event.startTime);

            let parsedEvent = new EventParser(event);
            let firstGoalInfo = parsedEvent.firstGoal;
            let scoreInfo = parsedEvent.score;

            let csvRow = [
                startDateTime.toLocaleDateString(),
                startDateTime.toLocaleTimeString(),
                event.name,
                scoreInfo.firstTime ? `${scoreInfo.firstTime[0]} - ${scoreInfo.firstTime[1]}` : '',
                `${scoreInfo.totals[0]} - ${scoreInfo.totals[1]}`,
            ];
            console.log(csvRow);

            // fileUtils.appendFile(`${section.shortName}.csv`, csvRow.join(';'), true);
        });
    },

};


(async () => {
    let date = new Date('2018-03-01');
    const yesterday = new Date();
    yesterday.setUTCHours(0, 0, 0, 0);
    yesterday.setDate(yesterday.getDate() - 1);

    while (date < yesterday) {
        date.setDate(date.getDate() + 1);
    }
    const url = await fonbetResults.getApiUrl(date);
    let results = await fonbetResults.fetchResults(url);
    let sections = fonbetResults.parseSectionEvents(results);
    sections.forEach(section => {
        fonbetResults.saveSectionEvents(section);
    });


})();
