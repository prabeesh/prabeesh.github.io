---
title: "MQTT Publisher and Subscriber in Scala with Eclipse Paho"
date: 2013-08-26T09:41:00+05:30
author: Prabeesh Keezhathra
tags:
  - MQTT
  - Scala
  - Eclipse Paho
  - IoT
keywords:
  - MQTT Scala
  - Eclipse Paho Scala
  - MQTT publisher subscriber
  - Mosquitto broker
description: A minimal MQTT publisher and subscriber in Scala using Eclipse Paho, plus how to run a local Mosquitto broker to test them against.
---

MQTT is a lightweight publish-subscribe protocol widely used in IoT and telemetry because it runs fine over slow, lossy networks. This post builds a minimal publisher and subscriber in Scala using the [Eclipse Paho](https://www.eclipse.org/paho/) library, talking to a local Mosquitto broker. The complete code is on [GitHub](https://github.com/prabeesh/MQTTScalaClient).

## How MQTT works

MQTT uses a central **broker**. Publishers send messages to **topics**, and any subscribers listening to a matching topic pattern receive them. Topics are hierarchical strings separated by `/`, for example `sensors/room1/temperature`, and subscriptions can use `+` (single level) and `#` (multi-level) wildcards.

Three QoS levels control delivery:

| QoS | Meaning | Use when |
| --- | --- | --- |
| 0 | At most once | Telemetry where the occasional drop is fine |
| 1 | At least once | Most sensor or command messages |
| 2 | Exactly once | When duplicates cause real problems |

## Installing the Mosquitto broker

On Ubuntu or Debian:

```bash
sudo apt-get install mosquitto mosquitto-clients
sudo systemctl start mosquitto
```

Quick sanity check with the CLI tools:

```bash
# Terminal 1
mosquitto_sub -t test/topic

# Terminal 2
mosquitto_pub -t test/topic -m "Hello MQTT"
```

## sbt setup

`build.sbt`:

```scala
name := "MQTTScalaClient"
version := "0.1"
scalaVersion := "2.10.4"

libraryDependencies += "org.eclipse.paho" % "org.eclipse.paho.client.mqttv3" % "1.0.2"

resolvers += "Eclipse Paho Repository" at "https://repo.eclipse.org/content/repositories/paho-releases/"
```

## Publisher

```scala
import org.eclipse.paho.client.mqttv3._
import org.eclipse.paho.client.mqttv3.persist.MqttDefaultFilePersistence

object Publisher {
  def main(args: Array[String]): Unit = {
    val brokerUrl = "tcp://localhost:1883"
    val topic     = "sensors/temperature"
    val qos       = 1
    val clientId  = "scala-publisher"

    val persistence = new MqttDefaultFilePersistence("/tmp/mqtt")
    val client = new MqttClient(brokerUrl, clientId, persistence)

    val opts = new MqttConnectOptions()
    opts.setCleanSession(true)
    client.connect(opts)

    val payload = """{"temperature": 22.5}"""
    val message = new MqttMessage(payload.getBytes("UTF-8"))
    message.setQos(qos)

    client.publish(topic, message)
    println(s"Published to $topic: $payload")

    client.disconnect()
  }
}
```

The flow: create an `MqttClient`, connect with an `MqttConnectOptions`, build an `MqttMessage`, call `publish`, and disconnect. That's the whole publisher API surface.

## Subscriber

```scala
import org.eclipse.paho.client.mqttv3._
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence

object Subscriber {
  def main(args: Array[String]): Unit = {
    val brokerUrl = "tcp://localhost:1883"
    val topic     = "sensors/+"   // all sensors
    val qos       = 1
    val clientId  = "scala-subscriber"

    val client = new MqttClient(brokerUrl, clientId, new MemoryPersistence())

    client.setCallback(new MqttCallback {
      override def messageArrived(topic: String, message: MqttMessage): Unit = {
        val payload = new String(message.getPayload, "UTF-8")
        println(s"Received on $topic: $payload")
      }
      override def connectionLost(cause: Throwable): Unit =
        println(s"Connection lost: ${cause.getMessage}")
      override def deliveryComplete(token: IMqttDeliveryToken): Unit = {}
    })

    client.connect()
    client.subscribe(topic, qos)
    println(s"Subscribed to $topic. Press Ctrl-C to exit.")

    // Keep the JVM alive so the callback can fire.
    Thread.currentThread().join()
  }
}
```

`MqttCallback.messageArrived` fires on every message matching the subscription. Anything else (filtering, persistence, downstream processing) goes in there.

## Running the example

Start the subscriber first so it's ready when the publisher fires:

```bash
sbt "runMain Subscriber"
```

In another terminal:

```bash
sbt "runMain Publisher"
```

The subscriber prints the JSON payload. You can also confirm with the CLI tools:

```bash
mosquitto_sub -t "sensors/+" -v
```

## A few practical notes

- **Clean session**: `setCleanSession(false)` lets the broker queue messages for your client while it's offline. Pair with a stable client ID.
- **Keep-alive**: `setKeepAliveInterval` controls how often the client pings the broker; lower values detect dropped connections faster but use more bandwidth.
- **Last Will and Testament**: `opts.setWill(topic, payload, qos, retained)` lets the broker publish a message on your behalf if the client disconnects uncleanly. Useful for device presence tracking.
- **TLS**: for anything beyond a local test, use `ssl://...` URLs and `setSocketFactory` with a properly configured `SSLContext`.

For related Scala and data-processing content, see [Apache Spark performance tuning](/blog/2023/01/06/performance-tuning-on-apache-spark/).
