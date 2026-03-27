---
title: "MQTT Publisher and Subscriber in Scala: Complete IoT Messaging Tutorial Using Eclipse Paho"
date: 2013-08-26T09:41:00+05:30
author: Prabeesh Keezhathra
tags: [Big Data, MQTT, Scala, Message Queue, IoT, Eclipse Paho, Mosquitto]
keywords: MQTT Scala tutorial, Eclipse Paho Scala, MQTT publisher subscriber, IoT messaging protocol, Scala MQTT example, message queue tutorial, MQTT broker setup, IoT data streaming
description: Master MQTT messaging in Scala with Eclipse Paho library. Learn to build robust publisher-subscriber systems for IoT applications, including broker setup, connection handling, error management, and real-world messaging patterns for distributed systems.
---

MQTT (Message Queuing Telemetry Transport) has become the backbone of IoT communication, enabling lightweight, reliable messaging between devices and applications. In this comprehensive tutorial, we'll build a complete MQTT publisher-subscriber system in Scala using the Eclipse Paho library, perfect for IoT data streaming and distributed messaging architectures.

### Understanding MQTT: The IoT Messaging Standard

MQTT is a publish-subscribe based lightweight messaging protocol designed specifically for resource-constrained environments and unreliable networks. Originally developed by IBM for oil pipeline monitoring, MQTT has evolved into the de facto standard for IoT communication due to its minimal overhead and robust delivery guarantees.

#### Key MQTT Advantages:
- **Lightweight**: Minimal protocol overhead (as low as 2 bytes)
- **Asynchronous**: Decoupled publisher-subscriber architecture
- **Quality of Service**: Three QoS levels for different reliability needs  
- **Persistent Sessions**: Maintains connection state across network interruptions
- **Last Will and Testament**: Automatic notification when clients disconnect unexpectedly

In an MQTT system, publishers send messages to specific **topics** through a central **broker**, which then routes these messages to all subscribers listening on those topics. This pattern enables highly scalable, loosely-coupled distributed systems.

#### Message Broker: Mosquitto

Mosquitto is a robust, open-source MQTT broker written in C, designed for efficiency and reliability in production environments. It supports all MQTT protocol features including:

- **Multiple Messaging Patterns**: Publish-subscribe, request-response, event-driven messaging
- **Security Features**: TLS/SSL encryption, client authentication, access control lists
- **Scalability**: Supports thousands of concurrent connections
- **Bridge Functionality**: Connects multiple brokers for distributed deployments
- **WebSocket Support**: Enables browser-based MQTT clients

**Installation on Ubuntu/Debian**:
```bash
# Install Mosquitto broker and clients
sudo apt-get update
sudo apt-get install mosquitto mosquitto-clients

# Start Mosquitto service
sudo systemctl start mosquitto
sudo systemctl enable mosquitto

# Test installation
mosquitto_pub -t test/topic -m "Hello MQTT"
mosquitto_sub -t test/topic
```

**Basic Mosquitto Configuration** (`/etc/mosquitto/mosquitto.conf`):
```
# Basic configuration
port 1883
allow_anonymous true

# Logging
log_type all
log_dest file /var/log/mosquitto/mosquitto.log

# Persistence
persistence true
persistence_location /var/lib/mosquitto/

# Security (for production)
# password_file /etc/mosquitto/passwd
# acl_file /etc/mosquitto/acl
```

### Eclipse Paho: Production-Ready MQTT Client Library

Eclipse Paho provides enterprise-grade MQTT client implementations across multiple programming languages, maintained by the Eclipse Foundation community. The Scala/Java implementation offers:

- **Synchronous and Asynchronous APIs**: Choose based on your application needs
- **Automatic Reconnection**: Built-in resilience for network failures
- **Message Persistence**: Local storage for reliable message delivery
- **SSL/TLS Support**: End-to-end encryption for secure communications
- **Quality of Service**: Full QoS 0, 1, and 2 support

The Eclipse Paho client libraries are production-tested, widely adopted, and actively maintained, making them an excellent choice for enterprise IoT applications.

### Building MQTT Applications in Scala

Our complete MQTT implementation is available in the [GitHub repository](https://github.com/prabeesh/MQTTScalaClient). Let's walk through building a robust publisher-subscriber system.

#### Project Setup and Dependencies

**Enhanced `build.sbt` configuration**:
```scala
// build.sbt
name := "MQTTScalaClient"
version := "0.3.0"
scalaVersion := "2.12.17"

// Core MQTT dependency
libraryDependencies ++= Seq(
  "org.eclipse.paho" % "org.eclipse.paho.client.mqttv3" % "1.2.5",
  "com.typesafe" % "config" % "1.4.2",
  "ch.qos.logback" % "logback-classic" % "1.2.12",
  "org.scalatest" %% "scalatest" % "3.2.15" % Test
)

// Eclipse repository for Paho releases
resolvers += "Eclipse Paho Repository" at "https://repo.eclipse.org/content/repositories/paho-releases/"

// Compiler options for better code quality
scalacOptions ++= Seq(
  "-deprecation",
  "-feature",
  "-unchecked",
  "-Xfatal-warnings"
)
```

This enhanced build configuration includes logging, configuration management, and testing frameworks essential for production applications.

#### Enhanced MQTT Publisher with Error Handling

```scala
// Publisher.scala
package main.scala

import org.eclipse.paho.client.mqttv3._
import org.eclipse.paho.client.mqttv3.persist.MqttDefaultFilePersistence
import java.util.concurrent.{Executors, ScheduledExecutorService, TimeUnit}
import scala.util.{Try, Success, Failure}

/**
 * Production-ready MQTT publisher with error handling and reconnection logic
 * @author Prabeesh Keezhathra
 * @mail prabsmails@gmail.com
 */
object Publisher extends App {

  // Configuration constants
  private val BROKER_URL = "tcp://localhost:1883"
  private val TOPIC = "sensors/temperature"
  private val QOS = 2 // Exactly once delivery
  private val CLIENT_ID = s"scala-publisher-${System.currentTimeMillis()}"
  
  private val persistence = new MqttDefaultFilePersistence("/tmp/mqtt-persistence")
  private val scheduler: ScheduledExecutorService = Executors.newScheduledThreadPool(2)
  
  @volatile private var client: MqttClient = _
  @volatile private var connected = false

  def main(args: Array[String]): Unit = {
    Try {
      setupMqttClient()
      startPublishing()
      
      // Keep application running
      println("Publisher started. Press Enter to stop...")
      scala.io.StdIn.readLine()
      
    } match {
      case Success(_) => println("Publisher completed successfully")
      case Failure(exception) => 
        println(s"Publisher failed: ${exception.getMessage}")
        exception.printStackTrace()
    } finally {
      cleanup()
    }
  }

  private def setupMqttClient(): Unit = {
    client = new MqttClient(BROKER_URL, CLIENT_ID, persistence)
    
    // Configure connection options
    val connOpts = new MqttConnectOptions()
    connOpts.setCleanSession(false) // Maintain session state
    connOpts.setKeepAliveInterval(30)
    connOpts.setConnectionTimeout(10)
    connOpts.setAutomaticReconnect(true)
    
    // Set up connection callback
    client.setCallback(new MqttCallback {
      override def messageArrived(topic: String, message: MqttMessage): Unit = {
        // Publisher typically doesn't receive messages
      }

      override def connectionLost(cause: Throwable): Unit = {
        connected = false
        println(s"Connection lost: ${cause.getMessage}")
        println("Attempting to reconnect...")
      }

      override def deliveryComplete(token: IMqttDeliveryToken): Unit = {
        println(s"Message delivery completed: ${token.getMessageId}")
      }
    })

    // Connect to broker
    println(s"Connecting to broker: $BROKER_URL")
    client.connect(connOpts)
    connected = true
    println("Successfully connected to MQTT broker")
  }

  private def startPublishing(): Unit = {
    scheduler.scheduleAtFixedRate(
      () => publishSensorData(),
      0, // Initial delay
      5, // Period
      TimeUnit.SECONDS
    )
  }

  private def publishSensorData(): Unit = {
    if (connected && client.isConnected) {
      Try {
        // Simulate sensor data
        val temperature = 20.0 + scala.util.Random.nextGaussian() * 5.0
        val timestamp = System.currentTimeMillis()
        val payload = s"""{"temperature": $temperature, "timestamp": $timestamp, "sensor_id": "temp_001"}"""
        
        val message = new MqttMessage(payload.getBytes("UTF-8"))
        message.setQos(QOS)
        message.setRetained(false)
        
        client.publish(TOPIC, message)
        println(s"Published: $payload")
        
      } match {
        case Success(_) => // Message published successfully
        case Failure(exception) => 
          println(s"Failed to publish message: ${exception.getMessage}")
      }
    } else {
      println("Client not connected, skipping publish...")
    }
  }

  private def cleanup(): Unit = {
    scheduler.shutdown()
    if (client != null && client.isConnected) {
      client.disconnect()
      client.close()
    }
    println("Publisher resources cleaned up")
  }
}
```

#### Robust MQTT Subscriber with Message Processing

```scala
// Subscriber.scala
package main.scala

import org.eclipse.paho.client.mqttv3._
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence
import scala.util.{Try, Success, Failure}
import scala.concurrent.{Future, ExecutionContext}
import java.util.concurrent.Executors

/**
 * Production-ready MQTT subscriber with robust error handling
 * @author Prabeesh Keezhathra  
 * @mail prabsmails@gmail.com
 */
object Subscriber extends App {

  private val BROKER_URL = "tcp://localhost:1883"
  private val TOPIC_PATTERN = "sensors/+"  // Subscribe to all sensor topics
  private val QOS = 2
  private val CLIENT_ID = s"scala-subscriber-${System.currentTimeMillis()}"
  
  private val persistence = new MemoryPersistence()
  private implicit val executionContext: ExecutionContext = 
    ExecutionContext.fromExecutor(Executors.newFixedThreadPool(4))

  def main(args: Array[String]): Unit = {
    Try {
      val client = setupMqttClient()
      println("Subscriber started. Press Enter to stop...")
      scala.io.StdIn.readLine()
      
      client.disconnect()
      client.close()
      
    } match {
      case Success(_) => println("Subscriber completed successfully")
      case Failure(exception) => 
        println(s"Subscriber failed: ${exception.getMessage}")
        exception.printStackTrace()
    }
  }

  private def setupMqttClient(): MqttClient = {
    val client = new MqttClient(BROKER_URL, CLIENT_ID, persistence)
    
    // Configure connection options
    val connOpts = new MqttConnectOptions()
    connOpts.setCleanSession(false)
    connOpts.setKeepAliveInterval(30)
    connOpts.setAutomaticReconnect(true)
    
    // Set up comprehensive callback handling
    client.setCallback(new MqttCallback {
      override def messageArrived(topic: String, message: MqttMessage): Unit = {
        // Process messages asynchronously to avoid blocking
        Future {
          processMessage(topic, message)
        }.recover {
          case exception => 
            println(s"Error processing message from topic $topic: ${exception.getMessage}")
        }
      }

      override def connectionLost(cause: Throwable): Unit = {
        println(s"Connection lost: ${cause.getMessage}")
        println("Automatic reconnection will be attempted...")
      }

      override def deliveryComplete(token: IMqttDeliveryToken): Unit = {
        // Not typically used in subscriber
      }
    })

    // Connect and subscribe
    println(s"Connecting to broker: $BROKER_URL")
    client.connect(connOpts)
    
    client.subscribe(TOPIC_PATTERN, QOS)
    println(s"Subscribed to topic pattern: $TOPIC_PATTERN")
    
    client
  }

  private def processMessage(topic: String, message: MqttMessage): Unit = {
    Try {
      val payload = new String(message.getPayload, "UTF-8")
      val qos = message.getQos
      val retained = message.isRetained
      
      println(s"📨 Message received:")
      println(s"   Topic: $topic")
      println(s"   QoS: $qos")
      println(s"   Retained: $retained")
      println(s"   Payload: $payload")
      println(s"   Timestamp: ${java.time.Instant.now()}")
      println("─" * 50)
      
      // Add your message processing logic here
      processBusinessLogic(topic, payload)
      
    } match {
      case Success(_) => // Message processed successfully
      case Failure(exception) => 
        println(s"Failed to process message: ${exception.getMessage}")
    }
  }

  private def processBusinessLogic(topic: String, payload: String): Unit = {
    // Example: Parse JSON, store in database, trigger alerts, etc.
    topic match {
      case t if t.startsWith("sensors/temperature") => 
        println("🌡️  Processing temperature data...")
        // Parse temperature JSON, check thresholds, etc.
        
      case t if t.startsWith("sensors/humidity") => 
        println("💧 Processing humidity data...")
        
      case _ => 
        println("🔄 Processing generic sensor data...")
    }
  }
}
```

### Advanced MQTT Patterns and Best Practices

#### Quality of Service Levels

Choose the appropriate QoS level based on your reliability requirements:

```scala
// QoS 0: At most once (Fire and forget)
message.setQos(0) // Fastest, no guarantees

// QoS 1: At least once (Acknowledged delivery)  
message.setQos(1) // Guaranteed delivery, possible duplicates

// QoS 2: Exactly once (Assured delivery)
message.setQos(2) // Guaranteed exactly once, highest overhead
```

#### Topic Design Patterns

Design hierarchical topics for scalable message routing:

```scala
// Good topic hierarchy
"building/floor1/room101/temperature"
"building/floor1/room101/humidity"
"building/floor2/room201/temperature"

// Subscription patterns
client.subscribe("building/+/+/temperature", 1) // All temperatures
client.subscribe("building/floor1/+/+", 1)      // All floor 1 sensors
client.subscribe("building/floor1/room101/+", 1) // All room 101 sensors
```

#### Connection Resilience

Implement robust connection handling for production systems:

```scala
private def createResilientConnection(): MqttClient = {
  val connOpts = new MqttConnectOptions()
  connOpts.setAutomaticReconnect(true)
  connOpts.setCleanSession(false)
  connOpts.setKeepAliveInterval(30)
  connOpts.setMaxInflight(1000)
  
  // Last Will and Testament
  connOpts.setWill(
    "clients/disconnect", 
    s"Client $CLIENT_ID disconnected unexpectedly".getBytes(),
    1,  // QoS
    true // Retained
  )
  
  client.connect(connOpts)
  client
}
```

### Production Deployment Considerations

#### Security Configuration

For production deployments, implement proper security:

```scala
// SSL/TLS configuration
val connOpts = new MqttConnectOptions()
connOpts.setSocketFactory(SSLSocketFactory.getDefault())

// Username/password authentication
connOpts.setUserName("your-username")
connOpts.setPassword("your-password".toCharArray)
```

#### Performance Optimization

Configure clients for optimal performance:

```scala
// Connection optimization
connOpts.setMaxInflight(1000)          // Maximum unacknowledged messages
connOpts.setConnectionTimeout(30)       // Connection timeout
connOpts.setKeepAliveInterval(60)       // Heartbeat interval

// Message optimization  
message.setRetained(false)             // Don't retain unless necessary
message.setQos(1)                      // Use QoS 1 for most cases
```

#### Monitoring and Observability

Implement comprehensive logging and monitoring:

```scala
// Add structured logging
import org.slf4j.LoggerFactory

private val logger = LoggerFactory.getLogger(getClass)

override def messageArrived(topic: String, message: MqttMessage): Unit = {
  logger.info(s"Message received - Topic: $topic, Size: ${message.getPayload.length} bytes")
  // Process message
}

override def connectionLost(cause: Throwable): Unit = {
  logger.error(s"MQTT connection lost", cause)
  // Implement alerting logic
}
```

### Real-World Applications and Extensions

This MQTT foundation enables numerous IoT and messaging applications:

#### IoT Data Pipeline
```scala
// Sensor data aggregation
sensors/+/temperature -> Data Processing -> Analytics Dashboard
sensors/+/alerts -> Alert Processing -> Notification System
```

#### Microservices Communication
```scala
// Event-driven architecture
orders/created -> Order Processing Service
orders/updated -> Inventory Service
orders/completed -> Billing Service
```

#### Real-Time Dashboard
```scala
// Live data visualization
metrics/cpu -> Dashboard
metrics/memory -> Dashboard  
metrics/network -> Dashboard
```

### Testing Your MQTT Implementation

**Terminal Testing**:
```bash
# Test publisher (in one terminal)
mosquitto_pub -t sensors/test -m "Hello from command line"

# Test subscriber (in another terminal)  
mosquitto_sub -t "sensors/+" -v
```

**Load Testing**:
```bash
# Publish multiple messages rapidly
for i in {1..1000}; do 
  mosquitto_pub -t sensors/load-test -m "Message $i"
done
```

This comprehensive MQTT tutorial provides a solid foundation for building scalable, reliable IoT messaging systems in Scala. The combination of Eclipse Paho's robust client library with Scala's functional programming capabilities creates an excellent platform for modern distributed applications.

For more advanced Scala tutorials and IoT development patterns, explore our related guides on [Apache Spark for IoT data processing](/blog/performance-tuning-on-apache-spark/) and [building real-time data pipelines](#).
