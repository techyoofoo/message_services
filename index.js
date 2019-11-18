import Hapi from "hapi";
import { publishToQueue, consume } from './src/services/mqservices';
import axios from 'axios';


var EventEmitter = require('events');
var notifier = new EventEmitter();

const init = async () => {
  await server.start();
  console.log("Server running on %s", server.info.uri);
  await socketServer.start();
  console.log("Server running on %s", socketServer.info.uri);
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

const socketServer = new Hapi.server({
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
        
        let data = await consume(queueName);
        notifier.emit('commission', JSON.parse(data));
           // notifier.emit('commission', msg);
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
    const promise = new Promise(async (resolve, reject) => {
      try {
        // var queueName = req.payload.queue;
        // let data = await consume(queueName);
        // notifier.emit('commission', JSON.parse(data));
        // //console.log(data)
        // return resolve(reply.response(JSON.parse(data)).code(200));
      }
      catch (error) {
        throw error
      }
    });
    return promise;
  }
})

var io = require('socket.io')(socketServer.listener);

io.on('connection', function (socket) {
  console.log("Connection succeed")
  notifier.on('commission', function (data) {
    socket.emit('commission', data);
  });
});



process.on("unhandledRejection", err => {
  console.log(err);
  process.exit(1);
});

init();
