import Hapi from "hapi";
import { publishToQueue, consume } from './src/services/mqservices';
import axios from 'axios';


var EventEmitter = require('events');
var notifier = new EventEmitter();

const init = async () => {
  await server.start();
  console.log("Server running on %s", server.info.uri);
  await wsServer.start();
  console.log("Server running on %s", wsServer.info.uri);
};

const server = new Hapi.server({
  port: process.env.PORT || 7003,
  host: process.env.IP || "localhost",
  routes: {
    cors: {
      origin: ["*"],
      headers: ["Accept", "Content-Type"],
      additionalHeaders: ["X-Requested-With"]
    }
  }
});

const wsServer = new Hapi.server({
  port: process.env.PORT || 4001,
  host: process.env.IP || "localhost",
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
  handler: function (request, h) {
    console.log('Test Data');
    return "Hello welcome to Message Queue services";
  }
});

//send messages to queue
server.route({
  method: 'POST',
  path: '/send_msg',
  handler: async (req, res) => {
    const promise = new Promise(async (resolve, reject) => {
      try {
        let payload = req.payload;
        axios
          .get(payload.map_url)
          .then(async (response) => {
            let queueName = payload.UB.data_body.queue;
            let msg = response.data.DropDownData;
            await publishToQueue(queueName, JSON.stringify(msg));
            return resolve({ Message: "Message sent", Data: response.data });
          })
          .catch(error => {
            throw error;
          });
      }
      catch (error) {
        throw error
      }
    });
    return promise;
  }
})

//recieve messages from queue
server.route({
  method: 'POST',
  path: '/receive_msg',
  handler: async (req, reply) => {
    var queueName = req.payload.queue;
    notifier.emit('news', { time: Date.now() });
    let data = await consume(queueName);
    console.log(data)
    return reply.response(data).code(200);
  }
})

var io = require('socket.io')(wsServer.listener);

io.on('connection', function (socket) {
    console.log("Connection succeed")
    notifier.on('news', function (action) {
       socket.emit('news', "Test");
       console.log("news notifier hit")
    });
});



process.on("unhandledRejection", err => {
  console.log(err);
  process.exit(1);
});

init();
