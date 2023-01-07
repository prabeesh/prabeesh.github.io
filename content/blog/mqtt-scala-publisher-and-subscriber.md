---
title: "MQTT Publisher and Subscriber in Scala: A Step-by-Step Guide Using Eclipse Paho"
date: 2013-08-26T09:41:00+05:30
author: Prabeesh Keezhathra
tags: [Big Data, MQTT, Scala, Message Queue, IoT]
keywords: MQTT Scala, Eclipse Paho, MQTT client, MQTT publisher, MQTT subscriber, IoT protocol, Scala MQTT example, Message queue protocol, MQTT implementation, MQTT tutorial, Big Data, MQTT Queue, MQTT Scala client, MQTT client example, Introduction to MQTT with Scala, Scala message queue example, Popular Scala message protocol, Message queue protocol example with Scala, Scala MQTT implementation, Message queue example Scala
description: Learn how to set up an MQTT publisher and subscriber in Scala using the Eclipse Paho library. MQTT (Message Queuing Telemetry Transport) is a popular protocol for machine-to-machine communication and Internet of Things (IoT) applications. Eclipse Paho is an open source project that provides MQTT client libraries in multiple programming languages. In this tutorial, we will go through the steps to install the Eclipse Paho library and use it to create an MQTT publisher and subscriber in Scala.
---
### What is MQTT?
MQTT (Message Queuing Telemetry Transport) is a publish-subscribe based lightweight messaging protocol for use on top of the TCP/IP protocol. It was designed to be used in resource-constrained environments and for communication between devices with low-bandwidth or unreliable networks. MQTT is often used in Internet of Things (IoT) applications to communicate between devices and a central server, as well as in other types of messaging systems. In an MQTT system, there is a central broker that receives messages from publishers and routes them to subscribers that are subscribed to the relevant topic. MQTT is a lightweight and efficient protocol that makes it well-suited for IoT and messaging use cases.

#### Message broker
Mosquitto is an open source message broker that implements the MQTT protocol. It is written in C and is designed to be lightweight and efficient, making it well-suited for use in resource-constrained environments such as those found in IoT devices. Mosquitto is often used as a central message broker in an MQTT system, receiving messages from publishers and routing them to subscribers that are subscribed to the relevant topic.

One of the key features of Mosquitto is its ability to support multiple messaging patterns, including publish-subscribe, request-response, and event-driven messaging. This makes it a versatile choice for a wide range of MQTT-based applications. Additionally, Mosquitto supports secure communication using Transport Layer Security (TLS) and Secure Sockets Layer (SSL), making it suitable for use in secure environments.

Overall, Mosquitto is a reliable and widely-used message broker that is well-suited for use in MQTT-based systems, particularly in the IoT space. In ubuntu mosquitto can be installed using the command 

```bash
$ sudo apt-get install mosquitto
```

### What is Eclipse Paho?
Eclipse Paho is an open source project that provides MQTT client libraries in multiple programming languages. It is a part of the Eclipse Foundation, a not-for-profit organization that supports the open source community. The Paho project was created in order to provide reliable open source implementations of MQTT and MQTT-SN messaging protocols that can be used by IoT developers and system integrators.

The Eclipse Paho client libraries provide an easy-to-use API for developers to implement MQTT clients and applications. They support a wide range of programming languages, including Java, C, C++, Python, Scala and many others. The libraries are available under the Eclipse Public License (EPL) and are actively maintained by a community of developers.

Overall, the Eclipse Paho client libraries are a reliable and widely-used choice for implementing MQTT clients and applications. They provide a simple API and support for multiple programming languages, making them a good choice for developers working on MQTT-based projects. 

Eclipse Paho is one mqtt client work well with mosquitto. You may read more about it [here](http://www.eclipse.org/paho/).

### MQTT Publisher and Subscriber in Scala
MQTT Scala subscriber and publisher code based on eclipse paho library 0.4.0 is available in the [GitHub repository](https://github.com/prabeesh/MQTTScalaClient)

First, you will need to install the Eclipse Paho library. You can do this by adding the following dependency to your `build.sbt` file:

```Scala
// build.sbt

// The name of the project
name := "MQTTScalaClient"

// The version of the project
version := "0.2.0"

// The version of Scala used by the project
scalaVersion := "2.10.3"

// Add the MQTT client library as a dependency
libraryDependencies += "org.eclipse.paho" % "mqtt-client" % "0.4.0"

// Add the MQTT repository as a resolver
resolvers += "MQTT Repository" at "https://repo.eclipse.org/content/repositories/paho-releases/"
```
This `build.sbt` file specifies the name, version, and Scala version for the project, as well as the dependencies and repository needed to build and run the MQTT Scala client.

Once the library is installed, you can start writing your publisher and subscriber code.

#### MQTT Publisher in Scala
To create an MQTT publisher in Scala, you will need to create an instance of the `MqttClient` class and connect to the MQTT broker. You can then use the `MqttClient#publish` method to send a message to a specific topic.

```Scala
// Publisher.scala

package main.scala

import org.eclipse.paho.client.mqttv3.MqttClient
import org.eclipse.paho.client.mqttv3.MqttException
import org.eclipse.paho.client.mqttv3.MqttMessage
import org.eclipse.paho.client.mqttv3.persist.MqttDefaultFilePersistence

/**
 * MQTT publisher
 * @author Prabeesh Keezhathra
 * @mail prabsmails@gmail.com
 */
object Publisher {

  def main(args: Array[String]) {
    // URL of the MQTT broker
    val brokerUrl = "tcp://localhost:1883"
    // MQTT topic to publish to
    val topic = "foo"
    // Message to publish
    val msg = "Hello world test data"

    var client: MqttClient = null

    // Creating new persistence for MQTT client
    val persistence = new MqttDefaultFilePersistence("/tmp")

    try {
      // Create MQTT client with specific URL and client ID
      client = new MqttClient(brokerUrl, MqttClient.generateClientId, persistence)

      // Connect to the broker
      client.connect()

      // Get the MQTT topic
      val msgTopic = client.getTopic(topic)
      // Create a new MQTT message with the message string
      val message = new MqttMessage(msg.getBytes("utf-8"))

      // Publish the message to the topic and print a message
      while (true) {
        msgTopic.publish(message)
        println("Publishing Data, Topic : %s, Message : %s".format(msgTopic.getName, message))
        Thread.sleep(100)
      }
    }

    catch {
      case e: MqttException => println("Exception Caught: " + e)
    }

    finally {
      // Disconnect from the broker
      client.disconnect()
    }
  }
}
```
The above code is an MQTT publisher in Scala that connects to an MQTT broker, publishes a message to a specific topic, and then disconnects from the broker.

Here is a brief overview of how the code works:

- The `brokerUrl`, `topic`, and `msg` variables are defined and initialized with the URL of the MQTT broker, the topic to publish to, and the message to be published, respectively.

- An `MqttClient` instance is created with the specified broker URL, a generated client ID, and a new `MqttDefaultFilePersistence` instance for storing client data.

- The MQTT client connects to the broker.

- The `getTopic` method is called on the client to get the MQTT topic, and a new `MqttMessage` is created with the message string.

- The message is published to the topic in a loop, and a message is printed to the console each time it is published.

- If an exception is thrown while running the loop, it is caught and a message is printed.

- Finally, the MQTT client is disconnected from the broker.

#### MQTT Subscriber in Scala
To create an MQTT subscriber in Scala, you will need to create an instance of the `MqttClient` class and connect to the MQTT broker. You can then use the `MqttClient#subscribe` method to subscribe to a specific topic, and the `MqttClient#Callback` method to set a callback function that will be called whenever a message is received on that topic.

```Scala
// Subscriber.scala

package main.scala

import org.eclipse.paho.client.mqttv3._
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence

/**
 * MQTT subscriber
 * @author Prabeesh Keezhathra
 * @mail prabsmails@gmail.com
 */
object Subscriber {

  def main(args: Array[String]) {
    // URL of the MQTT broker
    val brokerUrl = "tcp://localhost:1883"
    // MQTT topic to subscribe to
    val topic = "foo"

    // Set up persistence for messages
    val persistence = new MemoryPersistence

    // Initialize MQTT client with broker URL, client ID, and persistence
    val client = new MqttClient(brokerUrl, MqttClient.generateClientId, persistence)

    // Connect to the MQTT broker
    client.connect

    // Subscribe to the MQTT topic
    client.subscribe(topic)

    // Set up a callback to handle incoming messages
    // Callback that is triggered when a new message arrives on the specified topic
    val callback = new MqttCallback {

      override def messageArrived(topic: String, message: MqttMessage): Unit = {
        // Print the received message to the console
        println("Receiving Data, Topic : %s, Message : %s".format(topic, message))
      }
      
      // Callback that is triggered if the connection to the broker is lost
      override def connectionLost(cause: Throwable): Unit = {
         // Print the cause of the connection loss
         println(cause)
       }

      // Callback that is triggered when a message has been successfully delivered
      override def deliveryComplete(token: IMqttDeliveryToken): Unit = {

      }
    }

    // Set up callback for MqttClient
    client.setCallback(callback)
  }
}
```

The MQTT subscriber code in Scala connects to an MQTT broker, subscribes to a specific topic, and then waits for messages to be published to that topic. When a new message is received, it is processed by a callback function that is triggered by the MQTT client.

Here is a brief overview of how the code works:

- The `brokerUrl` and `topic` variables are defined and initialized with the URL of the MQTT broker and the topic to subscribe to, respectively.

- A new `MemoryPersistence` instance is created to store messages, and an `MqttClient` instance is initialized with the specified broker URL, a generated client ID, and the `MemoryPersistence` instance.

- The MQTT client connects to the broker and subscribes to the specified topic.

- A callback object is defined with three functions: `messageArrived`, `connectionLost`, and `deliveryComplete`.

- The `messageArrived` function is called when a new message is received on the subscribed topic and prints the received message to the console.

- The `connectionLost` function is called if the connection to the broker is lost and prints the cause of the connection loss.

- The `deliveryComplete` function is called when a message has been successfully delivered.

- The callback object is set as the callback for the MQTT client.

This tutorial demonstrated how to use the Eclipse Paho library to create an MQTT publisher and subscriber in Scala. It showed how to connect to an MQTT broker, publish and receive messages, and handle connection loss and message delivery. I hope you found this tutorial helpful and that you now have a better understanding of how to use MQTT with Scala. Happy coding!
