import Hapi from "hapi";
import { publishToQueue, consume } from './src/services/mqservices';

const init = async () => {
  await server.start();
  console.log("Server running on %s", server.info.uri);
};

const server = Hapi.server({
  port: process.env.PORT || 7003,
  host: process.env.IP || "0.0.0.0",
  routes: {
    cors: {
      origin: ["*"],
      headers: ["Accept", "Content-Type"],
      additionalHeaders: ["X-Requested-With"]
    }
  }
});
server.route({
  method: "GET",
  path: "/",
  handler: function(request, h) {
    console.log('Test Data');
    return "Hello welcome to Message Queue services";
  }
});
//send messages to queue
server.route({
  method:'POST',
  path: '/send_msg',
  handler: async (req, res) => {
    var queueName = req.payload.queue;
    var msg = req.payload.message;
    await publishToQueue(queueName, msg);
    res.statusCode = 200;
    res.data = { "message-sent": true };
    return res;
  }
})

//recieve messages from queue
server.route({
  method:'POST',
  path:'/receive_msg',
  handler: async (req, h) => {
    var queueName = req.payload.queue;
    consume(queueName, res);
    res.statusCode = 200;
    return res;
  }
})

process.on("unhandledRejection", err => {
  console.log(err);
  process.exit(1);
});

init();
