'use strict';

const cluster_id = 'devicehive';

const client_id = 'devicehive-producer';
const topic = 'device-data';

const opts = {
    url: 'nats://127.0.0.1:4222',
    maxPubAcksInflight: 500000,
    ackTimeout: 60000
};

const   stan    = require('node-nats-streaming').connect(cluster_id, client_id, opts),
        pino    = require('pino')(),
        sleep    = require('sleep');

const BATCH_SIZE = 100000;
const NUM_BATCHES = 10;

stan
    .on('connect', function () {
        pino.info("STAN connected!");
        start();
    })
    .on('error', function(reason) {
        pino.error(reason);
    });


async function start() {
    let whole_test_now = new Date().getTime();
    for (let i = 0; i < NUM_BATCHES; i++) {
        let now = new Date().getTime();

        for (let j = 0; j < BATCH_SIZE; j++) {

            // if(stan.pubAckOutstanding >= opts.maxPubAcksInflight){
            //     //sleep.msleep(500);
            //     sleep.msleep(1000);
            //     // await flush(stan.nc);
            //     j--;
            //     continue;
            // }

            stan.publish(topic, `{"n":${j},"ts":${new Date().getTime()}}`, function(err, guid){
                if(err) {
                    pino.error(err);
                }else{

                }
            }.bind(stan));
        }

        pino.info(`${BATCH_SIZE} sent: ${new Date().getTime() - now}`);
    }

    pino.info(`${BATCH_SIZE * NUM_BATCHES} msgs sent within: ${new Date().getTime() - whole_test_now} ms`);
}

// function flush(nats){
//     return new Promise((resolve, reject) =>{
//         nats.flush(()=>{
//             resolve();
//         });
//     });
// }
