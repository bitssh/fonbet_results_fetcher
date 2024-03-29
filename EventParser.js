const _ = require('lodash');
const validateParsing = true;
const switchcase = require('switchcase');
const moment = require("moment");

const EVENT_STATUS = {
    COMPLETED: 3,
    CANCELED: 4,
    INTERRUPTED: 9,
};

class EventParser {
    /**
     * @param {Object} event
     * @param {string} event.score
     * @param {string} event.comment1
     * @param {string} event.comment2
     * @param {string} event.comment3
     * @param {string} event.name
     * @param {number} event.status
     * @param {number} event.startTime
     */
    constructor(event) {
        this.scoreInfo =  this.parseScore(event.score);
        this.firstGoal = this.parseFirstGoalComment(event.comment3);
        this.teamNames = event.name.split(' - ');
        this.originalName = event.name;
        this.startMoment =  moment.unix(event.startTime);
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
     * @returns {{teamNo: null, time: null}}
     */
    parseFirstGoalComment(comment) {
        let result = {
            time: null,
            teamNo: null,
        };
        if (comment && comment.startsWith('1-й гол:'))  {
            let time = comment.match(/\d+(?=-мин)/);
            let teamNo = comment.match(/\d+(?=-я)/);
            result = {
                time: time ? time[0] : null,
                teamNo: teamNo ? teamNo[0] - 1 : null,
            };

            if (validateParsing) {
                let strTeamNo = teamNo ? ` ${teamNo}-я` : '';
                let strTime = time ? ` на ${time}-мин` : '';
                let strResult = `1-й гол:${strTeamNo}${strTime}`;
                if (strResult !== comment) {
                    throw new Error(`Incorrectly parsed first goal comment "${comment}" - is not equals "${strResult}"`);
                }
            }
        }
        return result;
    }
    /**
     *
     * @returns {null|number|*}
     */
    get firstGoalTeamNo() {
        let result = this.firstGoal.teamNo;
        if (result !== null)
            return result;

        let score = this.scoreInfo.firstTime;
        if (!score || score[0] === score[1]) {
            score = this.scoreInfo.totals;
        }
        if (score[0] > score[1])
            return 0;
        else if (score[0] < score[1])
            return  1;
        else
            return null;
    }

    /**
     *
     * @returns {string}
     */
    get firstGoalTeamName() {
        if (this.firstGoalTeamNo === null) {
            return ''
        }
        return this.teamNames[this.firstGoalTeamNo];
    }

    static logUnusualEventData(event) {
        if (event.comment1 || event.comment2) {
            console.log('Found uncommon event comments', event);
        }
        if (event.status !== EVENT_STATUS.COMPLETED) {
            const warnDescription = `Event [${event.id}] ` + switchcase({
                [EVENT_STATUS.CANCELED]: `is canceled`,
                [EVENT_STATUS.INTERRUPTED]: `is interrupted`,
                default: ` has unknown status`
            })(event.status);

            console.info(warnDescription);
        }
    }

    get asCsvRow () {
        let { scoreInfo } = this;
        return [
            this.startMoment.toDate().toLocaleDateString(),
            this.startMoment.toDate().toLocaleTimeString(),
            this.originalName,
            scoreInfo.firstTime ? `'${scoreInfo.firstTime[0]} - ${scoreInfo.firstTime[1]}` : '',
            this.firstGoal.time ? this.firstGoal.time : '',
            this.firstGoalTeamName,
            `'${scoreInfo.totals[0]} - ${scoreInfo.totals[1]}`,
        ].join(';');
    };



}

exports.EventParser = EventParser;
