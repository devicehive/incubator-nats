'use strict;'

const   NATS = require('nats'),
        pino = require('pino')();
// const nats = NATS.connect({url: 'nats://wskafka:4222'});
const nats = NATS.connect({url: 'nats://127.0.0.1:4222'});

let last_received = 0, total_received = 0;
let avg_speed = 0, avg_count = 0;

nats
    .on('error', (e) => {
        pino.error(e);
    })
    .on('disconnect', ()=> console.log('disconnected'))
    .on('connect', (c) => {
        pino.info('connected');
        subscribe.call(this);
    })
    .on('reconnect', (c) => {
        pino.info('reconnected');
        subscribe.call(this);
    })
    .on('close', (c) => console.log('closed'))
    .on('subscribe', (a,b,c) => {
        pino.info(a);
        pino.info(b);
        pino.info(c);

        setInterval(function(){
            if(total_received - last_received > 0) {
                let current_mps = total_received - last_received;
                avg_speed = Math.ceil((avg_speed * avg_count + current_mps)/ ++avg_count);
                pino.info(`Total received: ${total_received}; msg/sec: ${current_mps}; avg mps: ${avg_speed}`);
                last_received = total_received;
            }
        }.bind(nats), 1000);

    });

let max_delay = 0;

function subscribe() {
    nats.subscribe('foo', {queue: 'test_queue'}, function (m) {
        if (total_received % 100000 === 0) {
            let delay = new Date().getTime() - JSON.parse(m).ts;
            max_delay = Math.max(max_delay, delay);
            pino.info(`Delay: current: ${delay}, max: ${max_delay}`);
        }
        total_received += 1;
    }.bind(this));
};
