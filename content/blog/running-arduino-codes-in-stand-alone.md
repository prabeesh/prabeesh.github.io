---
title: "Running Arduino codes in stand alone atmega8"
date: 2012-07-14T02:23:00+05:30
tags: [Arduino, Embedded]
keywords: arduino alternatives, simple arduino, arduino examples in atmega8, arduino codes in atmega8, arduino run in atmega8, running adruino code in atmega
description: Learn how to run Arduino codes on the ATmega8 microcontroller. Explore alternatives to Arduino boards and understand the process of programming and incorporating the ATmega8 into your circuits. This tutorial provides step-by-step instructions on setting up the Arduino IDE, selecting the appropriate programmer and board, and configuring the fuse bytes for running Arduino codes on the ATmega8 at 8MHz. Discover the mapping between the ATmega8 and Arduino and start experimenting with your own projects.
---
An Arduino board consists of an 8-bit Atmel AVR microcontroller with complementary components to facilitate programming and incorporation into other circuits.
If you wish to study the arduino codes ,then one of the major problems is the availability and cost of the Arduino board. If you have an atmega8 microcontroller  then you have to study the Arduino codes by simply changing some options in Arduino IDE.

First download the arduino IDE(I am using Arduino 1.0). Next you have to an avr  programmer(I am using usbasp and usbtiny).
Launch the arduino IDE as root.Then select your programmer from tools and also select your board  in this case select ATmega8.
Take care in fuse bytes because arduino codes are running in 8MHz.Y ou can enable internal 8MHz clock by

```c
-U lfuse:w:0xa4:m -U hfuse:w:0xcc:m
```
Or you can enable the external crystal by setting the fuse byte as <!--more-->

```c
-U lfuse:w:0xef:m
```
and put a  8MHz crystal.

You can find mapping between atmega8 and arduino here

{% img center /images/arduino.png 600 350 'image' 'images' %}
