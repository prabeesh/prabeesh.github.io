---
title: "Simplest and Low cost USB AVR Programmer USBtinyISP"
date: 2012-07-04T19:39:00+05:30
tags: [AVR, Embedded]
keywords: simplest and low cost usb avr, next.gr usb avr, lowcost avr programmer, AVR programmer using USBtiny ISP, AVR programmer low cost, AVR attiny programmer, attiny2313 programmer, atmega8 programmer, usbtinyisp
description: Simplest and low cost AVR programmer using attiny2313 for burn attiny, atmega8, AVR family etc 
---

This is the low cost AVR programmer using attiny2313. The schematic diagram is given below.

![USB tiny circuit](/images/usbtiny_circuit.png)

First setup the circuit as shown. Refer [this site](https://learn.adafruit.com/usbtinyisp) for to burn program to this attiny 2313.

One important care is taken to make fuse bit <!--more-->

```c
avrdude -c usbasp -p t2313 -U hfuse:w:0xdf:m -U lfuse:w:0xef:m
```
If you use the serial port to write the program , use stk200 command instead of usbasp.

{% img center /images/040720129881.jpg 600 350 'image' 'images' %}

{% img center /images/04072012989.jpg 600 350 'image' 'images' %}
