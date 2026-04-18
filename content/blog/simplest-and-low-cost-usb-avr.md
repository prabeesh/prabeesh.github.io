---
title: "How to Build a USBtinyISP: Low-Cost DIY AVR Programmer"
date: 2012-07-04T19:39:00+05:30
author: Prabeesh Keezhathra
tags:
  - AVR
  - USBtinyISP
  - ATtiny2313
  - microcontroller
  - embedded systems
keywords:
  - USBtinyISP
  - DIY AVR programmer
  - AVR microcontroller
  - ATtiny2313
  - ATmega8
  - USB programmer
description: Build a low-cost DIY USB programmer for AVR microcontrollers. Walks through the circuit, fuse-bit configuration with avrdude, and how to program ATtiny and ATmega chips.
---

Atmel AVR chips power a lot of hobby and embedded projects, small, cheap, well-documented. To get code onto them you need a programmer, and commercial ISPs run $20-$40 for something that's basically an ATtiny running open-source firmware. The USBtinyISP flips that: it's a DIY programmer built around an ATtiny2313, costs a few dollars in parts, and works with almost any AVR target (ATtiny, ATmega, etc.).

This post walks through building one.

## What you need

- An ATtiny2313 (the microcontroller running the programmer firmware)
- Passive components: resistors, capacitors, a 12 MHz crystal, a USB-B connector
- A 6-pin ISP header to connect to target chips
- A PCB or breadboard

The reference design is well documented, [Adafruit's USBtinyISP guide](https://learn.adafruit.com/usbtinyisp) has the schematic, PCB layout, and firmware image. Follow that for the build.

![USBtinyISP circuit](/images/usbtiny_circuit.png)

## Bootstrapping: programming the ATtiny2313

There's a chicken-and-egg problem: to flash the USBtinyISP firmware onto the ATtiny2313, you need another programmer. Any working ISP (a friend's, a commercial unit, an Arduino-as-ISP) will do, you only need it once.

Once the firmware is on the 2313, the board becomes self-sufficient.

## Setting fuse bits

Fuse bits control clock source, brown-out detection, and reset behavior. For the USBtinyISP running at 12 MHz from an external crystal, set:

```bash
avrdude -c usbasp -p t2313 \
  -U hfuse:w:0xdf:m \
  -U lfuse:w:0xef:m
```

If you're bootstrapping with a serial-port ISP instead of USB, swap `-c usbasp` for `-c stk200`.

## Using the programmer

Once built and flashed, the USBtinyISP shows up as a USB device. avrdude talks to it out of the box:

```bash
# Read the target chip's signature to confirm the wiring
avrdude -c usbtiny -p m8 -n

# Flash an ATmega8 with a compiled hex file
avrdude -c usbtiny -p m8 -U flash:w:firmware.hex
```

Most AVR toolchains, Arduino IDE, PlatformIO, plain avr-gcc + avrdude, accept `usbtiny` as a programmer type, so you can use the same board across workflows.

| Target family | Example chips | Notes |
| --- | --- | --- |
| ATtiny | ATtiny13, ATtiny85, ATtiny2313 | Fully supported |
| ATmega (8-bit) | ATmega8, ATmega328P, ATmega32 | Fully supported |
| AVR32 (32-bit) | AT32UC3 series | Check target datasheet first |

## My build

Here's the board I ended up with:

![USBtinyISP board, top view](/images/040720129881.jpeg)
![USBtinyISP board, angled view](/images/04072012989.jpeg)

## Related

- [Programming a standalone ATmega8 with Arduino code](/blog/2012/07/14/running-arduino-codes-in-stand-alone/)
- [Finding the RC constant using an ATmega8](/blog/2012/07/14/finding-rc-constant-using-atmega8/)
- [Introduction to AVR programming](/blog/2012/02/21/introduction-to-avr-programing/)
