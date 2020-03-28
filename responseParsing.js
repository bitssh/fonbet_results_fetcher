const {EventParser} = require("./EventParser");
const _ = require('lodash');

const filterSportMatching = 'Киберфутбол';
const filterSectionsContaining = ['Евролига', 'Мировая лига', 'Лига Про', 'Серия дерби', 'Серия сборных'];
/**
 * @param {Array} resultsResponseData.sports
 * @param {Array <{sport: string, name: string, events: Array<number>}>} resultsResponseData.sections
 * @param {Array <{id: string}>} resultsResponseData.events
 * @param resultsResponseData
 * @return {{sport: string, name: string, events: Array<number>, shortName: string}[]}
 */
exports.parseSections = function parseSections(resultsResponseData) {
    if (!this.sportId) {
        const sport = resultsResponseData.sports.find(sport => sport.name === filterSportMatching);
        if (!sport) {
            console.error('Fetched data', resultsResponseData);
            throw new Error(`Not found sport name "${filterSectionsContaining}"`);
        }
        this.sportId = sport.id;
    }

    if (!resultsResponseData.sections)
        return null;

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
};
/**
 * @param section
 * @param {string} section.shortName
 * @param {Array <Object>} section.events
 */
exports.parseSectionEvents = function parseSectionEvents(section) {
    const result = section.events.map((event) => {
        EventParser.logUnusualEventData(event);
        if (!event.score) {
            console.info('Event has empty score');
            return null;
        }
        try {
            return new EventParser(event);
        } catch (e) {
            console.error(`Failed to parse event\n${e.message}`, event);
            return null;
        }
    });
    return _.compact(result);
};
