const Route = require('../utils/classes/Route');

new Route(__dirname, '/', 'get', (req, res) => {
    res.send({
        code: 200,
        errors: [],
        responses: [{
            code: 'OK',
            message: `Welcome to Kastels API v${require('../../package.json').version}`,
        }],
    });
});