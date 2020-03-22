const _ = require('lodash');
const validateParsing = true;

class EventParser {
    /**
     * @param {Object} event
     * @param {string} event.score
     * @param {string} event.comment3
     */
    constructor(event) {
        try {
            this.score =  this.parseScore(event.score);
            this.firstGoal = this.parseFirstGoalComment(event.comment3);
        } catch (err) {
            console.error(`Failed to parse event {"${event.score}", "${event.comment3}". ` + err.message);
            throw err;
        }
    }
    /**
     *
     * @param scoreString - e.g. "2:2(1-0)", "1:3"
     * @returns {{firstTime: (null|string), totals: string[]}}
     */
    parseScore(scoreString) {
        let matches = scoreString.match(/\d+\D\d+/g);
        if (_.isEmpty(matches)) {
            throw new Error(`Invalid score string "${scoreString}"`);
        }
        let totals = matches[0].split(/\D+/);
        let firstTime = matches.length > 1 ? matches[1].split(/\D+/) : null;

        if (validateParsing) {
            let strResult = `${totals[0]}:${totals[1]}` + (firstTime ? `(${firstTime[0]}-${firstTime[1]})` : '');
            if (strResult !== scoreString) {
                throw new Error(`Incorrectly parsed score string "${scoreString}" - is not equals ${strResult}`);
            }
        }
        return { totals, firstTime };
    }
    /**
     *
     * @param comment - e.g. "1-й гол: на 34-мин", "1-й гол: 2-я", "1-й гол: 1-я на 20-мин",
     * @returns {null|{teamNo: (*|null), time: (*|null)}}
     */
    parseFirstGoalComment(comment) {
        if (comment && comment.startsWith('1-й гол:'))  {
            let time = comment.match(/\d+(?=-мин)/);
            let teamNo = comment.match(/\d+(?=-я)/);
            let result = {
                time: time ? time[0] : null,
                teamNo: teamNo ? teamNo[0] : null,
            };

            if (validateParsing) {
                let strTeamNo = teamNo ? ` ${teamNo}-я` : '';
                let strTime = time ? ` на ${time}-мин` : '';
                let strResult = `1-й гол:${strTeamNo}${strTime}`;
                if (strResult !== comment) {
                    throw new Error(`Incorrectly parsed first goal comment "${comment}" - is not equals "${strResult}"`);
                }
            }
            return result;
        }
        return null;
    }
}

exports.EventParser = EventParser;
