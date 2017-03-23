const fs = require('fs');
const path = require('path');
const swiftclient = require('./osSwift');

module.exports = ThumbnailService;

function ThumbnailService(rawLog, logger) {

    var server = undefined;

    /**
     * Starts the server.
     *
     * @param app express app
     */
    this.start = function start(app) {
        var self = this;
        server = app.listen(app.get('port'), function() {
            var host = server.address().address;
            var port = server.address().port;
            logger.info('[start] listening at http://%s:%s', host, port);
        });
    }

    /**
     * req.body = { main: String, code: String, name: String }
     */
    this.initCode = function initCode(req, res) {
        if (status === Status.ready) {
            try {
                var body = req.body || {};
                var message = body.value || {};
                logger.info('[initCode]', body);

                // Not expected zip which would come from message.lib
                if (message.main && message.code && typeof message.main === 'string' && typeof message.code === 'string') {
                    // .... app-specific initialization ...
                    res.status(200).send();
                }
            } catch (e) {
                logger.error('[initCode]', 'excception', e);
                res.status(500).send();
            }
        } else res.status(409).send();
    }

    /**
     * req.body = { value: Object, meta: { activationId : int } }
     */
    this.runCode = function runCode(req, res) {
        var meta = (req.body || {}).meta;
        // expects the request body to contain a swiftObject;
        // e.g. { "swiftObj": { "method": "PUT", "container": "images", "object": "600_0985.jpg" } }
        var payload = (req.body || {}).value.swiftObj;      // set the parameters in the payload object to pass to the processing functions
        // console.log('payload: '+JSON.stringify(payload));

        // If the OpenStack Swift's method was 'PUT', the action was an upload of a new image.
        // The new image should be transformed into a thumbnail
        if ( payload.method == 'PUT' ) {
            swiftclient.transformImage(payload, function onSuccess(params){
                logger.info('Image thumbnail created successfully');
                console.log('Image thumbnail created successfully');
                imagePath = params.container+'/'+params.object;
                thumbnailPath = params.thumbnailContainer+'/'+path.basename(thumbnail);

                // Specify the output of the Whisk action
                var result = {
                    result: {
                        success: 'Thumbnail created successfully',
                        source: imagePath,
                        thumbnail: thumbnailPath
                    }
                };
                res.status(200).json(result);
            });
        } else {  // This action will not be called on 'GET'. The only other method supported by OpenStack is DELETE, we assume this and take no action on the object
            // image deleted don't take any action
            var result = {
                result: {
                    success: 'No action taken, image was deleted'
                }
            }
            res.status(200).json(result);
        }
    }
}

ThumbnailService.getService = function(rawLog, logger) {
    return new ThumbnailService(rawLog, logger);
}
