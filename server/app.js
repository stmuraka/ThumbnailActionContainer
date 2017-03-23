var util       = require('util');
var bodyParser = require('body-parser');
var express    = require('express');
var app        = express();
var logger  = require('./src/logger').getLogger('logs/thumbnail.log', 'thumbnail');

var port = 8080


/**
 * instantiate an object which handles REST calls from the Invoker
 */
var service = require('./src/service').getService(console, logger);

app.set('port', port);
app.use(bodyParser.json());
app.post('/init', safeEndpoint(service.initCode));
app.post('/run',  safeEndpoint(service.runCode));
app.get('/test', function(req, res){
    res.send('hello');
})
app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('bad request');
  });
console.log('Starting image thumbnail action');
service.start(app);

/**
 * Wraps an endpoint with a try-catch to catch errors and close off http
 * responses correctly in case of errors.
 *
 * @param ep function endpoint
 * @return new function closure with internal try-catch
 */
function safeEndpoint(ep) {
    return function safeEndpoint(req, res, next) {
        try {
            ep(req, res, next);
        } catch (e) {
            logger.error('[safeEndpoint]', 'exception caught', e);
            res.json({ error : 'internal error' });
        }
    };
}
