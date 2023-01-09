---
title: "AVR Programming Made Easy: How to Build a USBtinyISP with an attiny2313"
date: 2012-07-04T19:39:00+05:30
author: Prabeesh Keezhathra
tags: [AVR, USBtinyISP, attiny2313, microcontroller, embedded systems]
keywords: simplest and low cost usb avr, next.gr usb avr, lowcost avr programmer, AVR programmer using USBtiny ISP, AVR programmer low cost, AVR attiny programmer, attiny2313 programmer, atmega8 programmer, USBtinyISP, AVR programming, AVR microcontrollers, programmer
description: Learn how to build a low cost AVR programmer using the attiny2313 microcontroller. Use the USBtinyISP to burn programs onto attiny, atmega8, and other AVR chips.
---

AVR microcontrollers are a popular choice for use in a wide range of applications, including embedded systems, robotics, and more. They are known for their low cost, versatility, and efficient use of resources, which make them an attractive choice for many developers. If you are working with AVR chips, you will need a programmer to burn programs onto them.

One option for an AVR programmer is the USBtinyISP, which is a simple and low cost solution based on the attiny2313 microcontroller. The attiny2313 is a member of the AVR family and is known for its small size and efficiency. It is a popular choice for use in AVR programming due to its low cost and versatility. With the USBtinyISP, you can use the attiny2313 to burn programs onto other AVR microcontrollers, such as the attiny and atmega8.

To build a USBtinyISP programmer, you will need to follow the schematic diagram provided below and set up the circuit as shown. The process is relatively straightforward, but it is important to pay attention to the details to ensure that the programmer is set up correctly. Refer [this site](https://learn.adafruit.com/usbtinyisp) for to burn program to the attiny2313.

![USB tiny circuit](/images/usbtiny_circuit.png)

Once the circuit is set up, you will need to configure the fuse bits to ensure proper operation of the programmer and the microcontroller being programmed. The fuse bits are special bits of configuration information that are stored on the microcontroller and control its behavior. To set the fuse bits on the USBtinyISP, you can use the following command:

```bash
avrdude -c usbasp -p t2313 -U hfuse:w:0xdf:m -U lfuse:w:0xef:m
```

Note that if you are using the serial port to write the program, you will need to use the stk200 command instead of usbasp.

Once the fuse bits are set, you can use the USBtinyISP to burn programs onto your AVR microcontrollers. In addition to the attiny and atmega8, the USBtinyISP can be used with other AVR chips as well. The process of burning a program onto a microcontroller is relatively simple and can be done using a variety of software tools.

These are the images of the USBtinyISP that I built.

![](/images/040720129881.jpeg)
![](/images/04072012989.jpeg)

Overall, the USBtinyISP is a simple and low cost solution for programming AVR microcontrollers. With its small size and efficient design, it is a great choice for anyone looking to work with these types of chips. Whether you are a beginner or an experienced developer, the USBtinyISP is a handy tool to have in your toolkit.
