const logger = require('../../src/utils/classes/logger');
const colors = require('../../src/utils/log');

try {
    logger.debug('This is a Normal Debug Message.');
    logger.info('This is a Normal Info Message.');
    logger.log('This is a Normal Log Message.');
    logger.warn('This is a Normal Warning Message.');
    logger.error('This is a Normal Error Message.');
    logger.loaded('This is a Normal Loaded Message.');

    logger.important.debug('This is an Important Debug Message.');
    logger.important.info('This is an Important Info Message.');
    logger.important.log('This is an Important Log Message.');
    logger.important.warn('This is an Important Warning Message.');
    logger.important.error('This is an Important Error Message.');
    logger.important.loaded('This is an Important Loaded Message.');

    console.log(`[${colors('yellow', 'Logger')}] ${colors('green', '✓')} Passed Logger Test`);
} catch (e) {
    console.log(`[${colors('yellow', 'Logger')}] ${colors('red', 'X')} Failed Logger Test`);
}