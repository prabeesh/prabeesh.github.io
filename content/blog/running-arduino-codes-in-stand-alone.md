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
An Arduino board is essentially an 8-bit Atmel AVR microcontroller with supporting components for easy prototyping. If you have a bare ATmega8 and a USB ISP (like a USBasp or USBtinyISP), you can skip the board entirely and flash sketches straight from the IDE.

## What you need

- A bare ATmega8 chip
- A USB ISP programmer (USBasp, USBtinyISP, or similar)
- The Arduino IDE (version 1.0 used here; later versions work too)
- Optionally, an 8 MHz crystal if you want to use an external clock

## IDE setup

1. Download the IDE and plug in the programmer.
2. Launch the IDE as root (needed for USB access on some Linux setups).
3. Under **Tools > Programmer**, pick your ISP (e.g. USBasp).
4. Under **Tools > Board**, select ATmega8.

## Fuse-byte configuration

The Arduino runtime assumes an 8 MHz clock. You need the fuse bytes set correctly before uploading any sketch.

For the **internal 8 MHz RC oscillator** (no crystal required):

```c
-U lfuse:w:0xa4:m -U hfuse:w:0xcc:m
```

For an **external 8 MHz crystal**:
<!--more-->

```c
-U lfuse:w:0xef:m
```

Once the fuses are set, use **Sketch > Upload Using Programmer** in the IDE. The sketch compiles, links, and flashes exactly as it would on a real board.

## Pin mapping

The ATmega8 pins map to Arduino "digital pin" numbers. Refer to the diagram below when wiring peripherals:

{% img center /images/arduino.png 600 350 'image' 'images' %}

## Related

- [How to build a USBtinyISP](/blog/2012/07/04/simplest-and-low-cost-usb-avr/) if you need a programmer
- [Measuring an RC time constant with an ATmega8](/blog/2012/07/14/finding-rc-constant-using-atmega8/) for another bare-chip project
