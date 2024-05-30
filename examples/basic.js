const fastify = require('fastify')();

const port = 4000;

// Require the ApiTraffic KOA library.
const apiTraffic = require('@apitraffic/fastify');

// Pulling this in so we can demo an outbound request being logged...
const axios = require('axios');

// Register the ApiTraffic Middleware...
fastify.register(apiTraffic, {});

/*
  Example passing in options.
  fastify.register(apiTraffic, {interceptOutbound: false});
*/

// Declare a route for '/'
fastify.get('/', async (request, reply) => {
  return { message: 'Hello, this is the root endpoint!' };
});

// Declare a route for '/outbound'
fastify.get('/outbound', async (request, reply) => {
  
  try{
      // Await the response of the fetch call
      const response = await axios.get('https://official-joke-api.appspot.com/random_joke')
      
      // once the call is complete, build the response...
      return { message: 'Hello, this is the outbound endpoint!' };

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