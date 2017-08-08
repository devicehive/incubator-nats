'use strict';

const cluster_id = 'devicehive';

const client_id = 'devicehive-producer';
const topic = 'device-data';

const opts = {
    url: 'nats://127.0.0.1:4222',
    maxPubAcksInflight: 16384,
   //  maxPubAcksInflight: 100000,
    ackTimeout: 60000
};

const   stan    = require('node-nats-streaming').connect(cluster_id, client_id, opts),
        pino    = require('pino')(),
        sleep    = require('sleep');

const BATCH_SIZE = 100000;
const NUM_BATCHES = 10;
let now;

stan
    .on('connect', function () {
        pino.info("STAN connected!");
        now = new Date().getTime();
        process();
        // start();
    })
    .on('error', function(reason) {
        pino.error(reason);
    });

let processed = 0;
const total = BATCH_SIZE * NUM_BATCHES;

function process(){
    if(processed <= total){
        setImmediate(send);
    }
    else{
        process.exit(0);
    }
}

function send(){
    for(processed; processed < total;) {
        if (stan.pubAckOutstanding >= opts.maxPubAcksInflight) {
            setTimeout(process, 100);
            // setImmediate(process);
            return
        }

        stan.publish(topic, `{"n":${processed},"ts":${new Date().getTime()}}`, function (err, guid) {
            if (err) {
                pino.error(err);
            } else {

            }
        }.bind(stan));
        processed++;

        if (processed % BATCH_SIZE == 0) {
            pino.info(`${BATCH_SIZE} sent: ${new Date().getTime() - now}`);
            now = new Date().getTime();
        }
    }
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

function start() {
    let whole_test_now = new Date().getTime();
    for (let i = 0; i < NUM_BATCHES; i++) {
        let now = new Date().getTime();

        for (let j = 0; j < BATCH_SIZE; j++) {
            if(stan.pubAckOutstanding >= opts.maxPubAcksInflight){
                //sleep.msleep(500);
                sleep.msleep(5000);
                // await flush(stan.nc);
                j--;
                continue;
            }

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
