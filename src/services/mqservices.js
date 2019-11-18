import rabbitConn from '../connection/mqconnection';

let ch = null;
let connection = null;
rabbitConn(function (conn) {
    connection = conn;
    // conn.createChannel(function (err, channel) {
    //      if (err) {
    //         throw new Error(err)
    //       }
    //     ch = channel;
    // }, {noAck: true});
});

export const publishToQueue = async (queueName, data) => {
    connection.createChannel(function (err, channel) {
        if (err) {
            throw new Error(err)
        }
        channel.assertQueue(queueName, {
            durable: true
        }, function (err, status) {
            channel.sendToQueue(queueName, new Buffer(data), { persistent: true });
            channel.close();
        });

    }, { noAck: true });
}

export const consume = async (queueName) => {
    console.log("Waiting for messages in %s.", queueName);
    //var q = queueName;
    //ch.noAck = true;
    const promise = new Promise(async (resolve, reject) => {
        try {
            connection.createChannel(function (err, channel) {
                if (err) {
                    throw new Error(err)
                }
                channel.assertQueue(queueName, { durable: true }, function (err, status) {
                    if (err) {
                        throw new Error(err)
                    }
                    else if (status.messageCount === 0) {
                        return "messages:0";
                    } else {
                        var numChunks = 0;
                        var responseData = '{"messages": [';
                        channel.consume(queueName.que, function (msg) {
                            var resChunk = msg.content.toString()
                            responseData = responseData.concat(resChunk)
                            if (numChunks < status.messageCount - 1) {
                                responseData = responseData.concat(',')
                            }
                            numChunks += 1
                            if (numChunks === status.messageCount) {
                                responseData = responseData.concat(']}')
                                channel.close();
                                // channel.close(function() {connection.close()})
                                return resolve(responseData);
                            }
                        })
                    }
                })
        
            }, { noAck: true });
        }
        catch (error) {
          throw error
        }
      });
      return promise;
}

process.on('exit', (code) => {
    //ch.close();
    // connection.close();
    console.log(`Closing rabbitmq channel`);
});