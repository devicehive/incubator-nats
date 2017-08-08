#Incubator for nats.io as a message broker

#Deploy
Use this command to run streaming docker container

```
docker run -d --name=nats-s -p 4222:4222 -p 8222:8222 -v "$(pwd)"/logs/:/var/logs/ nats-streaming -store file -dir /var/logs/datastore -mm 0 -mb 0 -l /var/logs/log.txt -cluster_id devicehive
```
Nats streaming can use memory or file to keep topic messages.
More info can be found [here](https://hub.docker.com/_/nats-streaming/)
Use `-SDV -DV` option to get more insights from logs.

More info on streaming libs: [streaming](https://github.com/nats-io/node-nats-streaming)
`note`: Streaming producer has issues with ack messages in flight limits
`note`: Streaming consumer has issues being disconnected from server

More info on nats libs: [nats](https://github.com/nats-io/node-nats)
`note`: nats consumer and producer works without known issues.