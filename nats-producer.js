'use strict;'

const   NATS = require('nats'),
        pino = require('pino')(),
        sleep = require('sleep');

// const nats = NATS.connect({url: 'nats://wskafka:4222'});
const nats = NATS.connect({url: 'nats://127.0.0.1:4222'});

const BATCH_SIZE = 1000000;
const NUM_BATCHES = 10;


nats
    .on('error', (e) => {
        pino.error(e);
})
    .on('disconnect', ()=> console.log('disconnected'))
    .on('connect', (c) => {
        pino.info('connected');
        send();
    })
    .on('reconnect', (c) => console.log('reconnected'));

async function send(){

    let whole_test_now = new Date().getTime();
    for (let i = 0; i < NUM_BATCHES; i++) {
        let now = new Date().getTime();

        for (let j = 0; j < BATCH_SIZE; j++) {
            nats.publish('foo', `{"n":${j},"ts":${new Date().getTime()}}`);
        }

        pino.info(`${BATCH_SIZE} sent: ${new Date().getTime() - now}`);
        await flush(nats);
        pino.info(`${BATCH_SIZE} flushed: ${new Date().getTime() - now}`);
    }

    pino.info(`${BATCH_SIZE * NUM_BATCHES} msgs sent within: ${new Date().getTime() - whole_test_now} ms`);
}


function flush(nats){
    return new Promise((resolve, reject) =>{
        nats.flush(()=>{
            resolve();
        });
    });
}