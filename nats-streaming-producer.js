'use strict';

const cluster_id = 'devicehive';

const client_id = 'devicehive-producer-' + new Date().getTime().toString();
const topic = 'device-data';

const opts = {
    url: 'nats://127.0.0.1:4222',
    // maxPubAcksInflight: 16384,
    maxPubAcksInflight: 100000,
    ackTimeout: 60000
};

const   stan    = require('node-nats-streaming').connect(cluster_id, client_id, opts),
        pino    = require('pino')();

const BATCH_SIZE = 100000;
const NUM_BATCHES = 10;
let now, whole_test_now;
let ack = 0;

stan
    .on('connect', function () {
        pino.info("STAN connected!");
        now = new Date().getTime();
        whole_test_now = now;
        processMessages();
    })
    .on('error', function(reason) {
        pino.error(reason);
    });

let processed = 0;
const TOTAL_MSGS = BATCH_SIZE * NUM_BATCHES;

async function processMessages(){
    if(processed <= TOTAL_MSGS){
        flush(stan.nc)
            .then(()=>{process.nextTick(send);});
    }
    else{
        process.exit(0);
    }
}

function send(){
    for(processed; processed < TOTAL_MSGS;) {
        if (stan.pubAckOutstanding >= opts.maxPubAcksInflight) {
            process.nextTick(processMessages)
            // setTimeout(processMessages, 100);
            // setImmediate(processMessages);
            return
        }

        stan.publish(topic, `{"n":${processed},"ts":${new Date().getTime()}}`, function (err, guid) {
            if (err) {
                pino.error(err);
            } else {
                if(++ack==TOTAL_MSGS){
                    pino.info(`${TOTAL_MSGS} msgs sent and acknowledged within: ${new Date().getTime() - whole_test_now} ms`);
                    process.exit(0);
                }
            }
        }.bind(stan));
        processed++;

        if (processed % BATCH_SIZE == 0) {
            pino.info(`${BATCH_SIZE} sent: ${new Date().getTime() - now}`);
            pino.info(`Packages still in flight: ${stan.pubAckOutstanding}`);
            now = new Date().getTime();

            if(processed == TOTAL_MSGS){
                pino.info(`${TOTAL_MSGS} msgs sent within rate: ${Math.ceil(TOTAL_MSGS/(Math.ceil(new Date().getTime() - whole_test_now) / 1000))} msg/sec; Total time: ${new Date().getTime() - whole_test_now} ms`);
                pino.info(`Packages still in flight: ${stan.pubAckOutstanding}`);
            }
        }
    }
    stan.nc.flush();
}

function flush(nats){
    return new Promise((resolve, reject) =>{
        nats.flush(()=>{
            resolve();
        });
    });
}