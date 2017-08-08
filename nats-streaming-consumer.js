'use strict';

const cluster_id = 'devicehive';

const client_id = 'devicehive-consumer-' + new Date().getTime().toString();
const queue_group = 'minion';
const topic = 'device-data';
const receive_only_new = true;

const opts = {
        url: 'nats://127.0.0.1:4222'
};

const   stan    = require('node-nats-streaming').connect(cluster_id, client_id, opts),
        pino    = require('pino')();

let total_received = 0, max_delay = 0, avg_speed = 0, last_received = 0, avg_count = 0;

stan
    .on('connect', function () {
        pino.info("STAN connected!");
        start();
    })
    .on('error', function(reason) {
        pino.error(reason);
    });

function start() {
    let opts = stan.subscriptionOptions();
    opts.setDurableName('consumer');
    opts.setMaxInFlight(1000000);
    // opts.setStartWithLastReceived();
    if(!receive_only_new) {
        opts.setDeliverAllAvailable();
    }

    let subscription = stan.subscribe(topic, queue_group, opts);
    subscription.on('error', function (err) {
        pino.error('subscription for ' + this.subject + " raised an error: " + err);
    });
    subscription.on('unsubscribed', function () {
        pino.info('unsubscribed to ' + this.subject);
    });
    subscription.on('ready', function () {
        pino.info('subscribed to ' + this.subject + ' qgroup:' + this.qGroup);

        setInterval(function(){
            if(total_received - last_received > 0) {
                let current_mps = total_received - last_received;
                avg_speed = Math.ceil((avg_speed * avg_count + current_mps)/ ++avg_count);
                pino.info(`Total received: ${total_received}; msg/sec: ${current_mps}; avg mps: ${avg_speed}`);
                last_received = total_received;
            }
        }, 1000);
    });

    subscription.on('message', function (msg) {
        if (total_received % 100000 === 0) {
            let delay = new Date().getTime() - JSON.parse(msg.getData()).ts;
            max_delay = Math.max(max_delay, delay);
            pino.info(`Delay: current: ${delay}, max: ${max_delay}`);
        }
        total_received += 1;
        // pino.info(msg.getSubject() + "[" + msg.getSequence() + "]: " + msg.getData());
    });
}