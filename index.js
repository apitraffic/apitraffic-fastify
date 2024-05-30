
const utilities = require('@apitraffic/utilities');
const package = require('./package.json');
const fp = require('fastify-plugin');

/**
 * ApiTraffic Express middleware function.
 * @param {{interceptOutbound?:boolean}} options - Configuration options.
 * @returns {Function} - apitraffic-express middleware.
 */
async function apiTraffic(fastify, options = {}){ 
    // Set things up...
    utilities.setup(options);

    fastify.decorateReply('payload', null)

    fastify.addHook('onSend', (request, reply, payload, done) => {
        reply.payload = payload;
        done();
    });
  
    fastify.addHook('onResponse', (request, reply, done) => {
        done()
        
        const requestReceivedAt = new Date().toISOString();

        // Set the request start time so we can figure out the total request duration...
        const requestStartTime = process.hrtime();

        // Go ahead and call the next function so KOA will continue processing...
        
        try{
            const apiTrafficOptions = {
                version: package.version,
                sdk: package.name                    
            };
            
            let body = null;

            if(request.method.toUpperCase() !== 'GET' && request.method.toUpperCase() !== 'OPTIONS'){
                body = JSON.stringify(request.body);
            }


            // TODO: Account for other body types other than JSON...
            const apiTrafficPayload = {
                request: {
                    received: requestReceivedAt,
                    ip : request.ip,
                    url : `${request.protocol}://${request.headers['host']}${request.url}`,
                    method: request.method,
                    headers : request.headers,
                    body : request.body
                },
                response : {
                    headers : reply.getHeaders(), 
                    status : reply.statusCode,
                    responseTime : utilities.getDuration(requestStartTime),
                    size: reply.getHeader('content-length'),
                    body : reply.payload
                }
            };
            
            // call the function to log all now...
            // we will not await the response b/c we want to fire and forget...
            utilities.sendToApiTraffic(apiTrafficOptions, apiTrafficPayload);
            
        }catch(e){
            console.log(e);
        }
        
  });

}
module.exports = fp(apiTraffic, {
    name: 'apitraffic-fastify'
});