const fastify = require('fastify')();

const port = 4000;

// Require the ApiTraffic KOA library.
const apiTraffic = require('@apitraffic/fastify');

// Pulling this in so we can demo an outbound request being logged...
const axios = require('axios');

// Register the ApiTraffic Middleware...
fastify.register(apiTraffic.middleware, {});

/*
  Example passing in options.
  fastify.register(apiTraffic.middlware, {interceptOutbound: false});
*/

// Declare a route for '/'
fastify.get('/', async (request, reply) => {
  return { message: 'Hello, world!' };
});

// Declare a route for '/authors'
fastify.get('/authors', async (request, reply) => {
  
  try{
     // add some tracing information to the request. You can add as many traces as required, think of it like console log.
     apiTraffic.trace("This is a sample trace from the sample ApiTraffic app.");

     // Await the response of the fetch call
     const response = await axios.get('https://thetestrequest.com/authors');
     
      // tag the request. You can add as many tags to a request as required.
      apiTraffic.tag("Account Id", "12345");

      // added a bit more tracing to show what can be done.
      apiTraffic.trace(`${response.data.length} authors were found.`);
      
      // once the call is complete, build the response...
      return response.data;

  } catch (error) {
      // Handle any errors that occur during the fetch
      console.error('Error fetching data:', error);
      throw error; // Rethrow the error for further handling if necessary
  }  
 
});

// Run the server
const start = async () => {
  try {
    await fastify.listen({port});
    console.log(`Server is running on http://localhost:${port}`);
  } catch (err) {
    process.exit(1);
  }
};

start();