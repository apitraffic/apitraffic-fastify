
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
    utilities.setup(options, utilities.context);

    

    fastify.addHook('onRequest', async (request, reply) => {
        // make sure the request context is setup with the RequestManager so it can be uses anywhere in the request...
        utilities.context.enterWith({ 
            RequestManager: new utilities.RequestManager({package : {name: package.name, version : package.version}})
        });
    });


    fastify.decorateReply('payload', null)

    fastify.addHook('onSend', (request, reply, payload, done) => {
        reply.payload = payload;
        done();
    });
  
    fastify.addHook('onResponse', (request, reply, done) => {
        done()
        
        //request.ApiTraffic = new utilities.RequestManager();
        
        try{
            const apiTrafficOptions = {
                version: utilities.context.getStore().RequestManager.package.version,
                sdk: utilities.context.getStore().RequestManager.package.name                 
            };
            
            let body = null;

            if(request.method.toUpperCase() !== 'GET' && request.method.toUpperCase() !== 'OPTIONS'){
                body = JSON.stringify(request.body);
            }


            // TODO: Account for other body types other than JSON...
            const apiTrafficPayload = {
                contextSid : utilities.context.getStore().RequestManager.contextSid,
                direction : "in",
                request: {
                    received: utilities.context.getStore().RequestManager.requestReceivedAt,
                    ip : request.ip,
                    url : `${request.protocol}://${request.headers['host']}${request.url}`,
                    method: request.method.toUpperCase(),
                    headers : request.headers,
                    body : request.body
                },
                response : {
                    headers : reply.getHeaders(), 
                    status : reply.statusCode,
                    responseTime : utilities.getDuration(utilities.context.getStore().RequestManager.requestStartTime),
                    body : reply.payload
                },
                tags : utilities.context.getStore().RequestManager.getTagArray(),
                traces : utilities.context.getStore().RequestManager.getTraces()
            };
            
            // call the function to log all now...
            // we will not await the response b/c we want to fire and forget...
            utilities.sendToApiTraffic(apiTrafficOptions, apiTrafficPayload);
            
        }catch(e){
            console.log(e);
        }
        
  });

}
module.exports.getContext = function(){
    return utilities.context.getStore();
  }
  
module.exports.getRequestManager = function(){
    return utilities.context.getStore().RequestManager;
}

module.exports.tag = function(key, value){
    utilities.context.getStore().RequestManager.tag(key, value);
  }
  
module.exports.trace = function(content){
    utilities.context.getStore().RequestManager.trace(content);
}

module.exports.middleware = fp(apiTraffic, {
    name: 'apitraffic-fastify'
});