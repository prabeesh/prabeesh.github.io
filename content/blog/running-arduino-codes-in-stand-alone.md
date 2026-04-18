---
title: "Running Arduino Code on a Standalone ATmega8"
date: 2012-07-14T02:23:00+05:30
tags: [Arduino, Embedded, ATmega8]
keywords:
  - ATmega8 Arduino
  - Arduino without board
  - Arduino IDE fuse bytes
description: Run Arduino sketches on a bare ATmega8 using the Arduino IDE, a USB ISP, and the right fuse-byte settings for an 8 MHz clock.
---
An Arduino board is essentially an 8-bit Atmel AVR microcontroller with supporting components to make it easy to program and prototype with. If you have a bare ATmega8 and a USB ISP (like a USBasp or USBtinyISP), you can skip the board entirely and use the Arduino IDE directly.

Download the Arduino IDE (I'm using 1.0) and plug in an AVR programmer. Launch the IDE as root, then under **Tools** pick your programmer and set the board to ATmega8.

The fuse bytes matter because Arduino code assumes an 8 MHz clock. Use the internal oscillator:

```c
-U lfuse:w:0xa4:m -U hfuse:w:0xcc:m
```

Or, if you have an 8 MHz crystal, configure the external oscillator instead:
<!--more-->

```c
-U lfuse:w:0xef:m
```

The ATmega8 to Arduino pin mapping:

{% img center /images/arduino.png 600 350 'image' 'images' %}
