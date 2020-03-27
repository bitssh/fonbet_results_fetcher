console.log('initialized');
const fetch = require('node-fetch');
const _ = require('lodash');
const fileUtils = require('../fonbet_live_watcher/src/fileTools');
const {EventParser} = require("./EventParser");

const fonbetDomainUrl = 'https://www.fonbet.ru';
const filterSportMatching = 'Киберфутбол';
const filterSectionsContaining = ['Евролига', 'Мировая лига', 'Лига Про', 'Серия дерби', 'Серия сборных'];

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
     * @param resultsResponseData
     * @return {{sport: string, name: string, events: Array<number> }[]}
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
     * @param section
     * @param {string} section.shortName
     * @param {Array <Object>} section.events
     */
    saveSectionEvents(section) {
        section.events.forEach((event) => {
            let startDateTime = new Date(event.startTime * 1000);
            let parsedEvent = new EventParser(event);
            let scoreInfo = parsedEvent.score;

            let csvRow = [
                startDateTime.toLocaleDateString(),
                startDateTime.toLocaleTimeString(),
                event.name,
                scoreInfo.firstTime ? `'${scoreInfo.firstTime[0]} - ${scoreInfo.firstTime[1]}` : '',
                parsedEvent.firstGoal.time ? parsedEvent.firstGoal.time : '',
                parsedEvent.firstGoalTeamName,
                `'${scoreInfo.totals[0]} - ${scoreInfo.totals[1]}`,
            ];
            fileUtils.appendFile(`${section.shortName}.csv`, csvRow.join(';'), true);
        });
    },

};


(async () => {
    // 2018-03-01
    let date = new Date('2020-03-18');
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    while (date < today) {
        try {
            const url = await fonbetResults.getApiUrl(date);
            let results = await fonbetResults.fetchResults(url);
            let sections = fonbetResults.parseSectionEvents(results);
            sections.forEach(section => {
                fonbetResults.saveSectionEvents(section);
            });
        } catch (err) {
            console.error(err.message);
        }

        date.setDate(date.getDate() + 1);
    }


})();
