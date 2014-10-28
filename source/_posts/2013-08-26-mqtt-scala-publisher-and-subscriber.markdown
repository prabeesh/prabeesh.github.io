---
layout: post
title: "MQTT Scala Publisher and Subscriber using Eclipse Paho"
date: 2013-08-26T09:41:00+05:30
comments: true
categories: [BigData, MQTT]
keywords: mqqt, protocol of IoT, Scala MQTT 
description: Implementation of MQTT in Scala, MQTT Publisher and Subscriber
---
MQTT is a machine-to-machine (M2M)/Internet of Things connectivity protocol. It was designed with extremely lightweight that support embedded and low power processing device. You may read more about it [here](http://mqtt.org/). MQTT is broker based message queuing system. To work with Mqtt, Mqtt Message broker/server required. [Mosquitto](http://mosquitto.org/) is an open source Mqtt Broker. In ubuntu mosquitto can be installed using the command 
```
sudo apt-get install mosquitto
```
Eclipse Paho is one mqtt client work well with mosquitto. You may read more about it [here](http://www.eclipse.org/paho/).

MQTT Scala subscriber and publisher code based on eclipse paho library 0.4.0 is available in [github](https://github.com/prabeesh/MQTTScalaClient)
