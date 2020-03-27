const fonbetDomainUrl = 'https://www.fonbet.ru';
const fetch = require('node-fetch');
const _ = require('lodash');

fetcher = {
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

    async getRandomUrl() {
        if (_.isEmpty(this.apiUrls)) {
            const response = await fetch(`${fonbetDomainUrl}/urls.json`);
            let {common: apiUrls} = await response.json();
            this.apiUrls = apiUrls.map(url => `https:${url}`);
        }
        return _.sample(this.apiUrls);
    },
    async fetchResults(url) {
        console.log(`fetching ${url}`);
        let response = await fetch(url);
        if (!response.ok) {
            console.error(`${new Date().toLocaleString()} ${response.status} - ${await response.text()}`);
            return;
        }
        return JSON.parse(await response.text());
    },
};

exports.fetcher = fetcher;
