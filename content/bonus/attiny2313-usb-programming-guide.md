---
title: "ATtiny2313 USBtinyISP Notes"
date: 2025-08-22T10:00:00+01:00
draft: false
tags:
  - AVR
  - ATtiny2313
  - USBtinyISP
  - embedded systems
keywords:
  - ATtiny2313
  - USBtinyISP
  - avrdude
  - USB programmer
description: "Short follow-up notes on the USBtinyISP build: reading fuses with avrdude and a basic what-to-check list when the board won't enumerate."
---

A short follow-up to [How to Build a USBtinyISP](/blog/2012/07/04/simplest-and-low-cost-usb-avr/). The original post covers the build; these are two things I end up doing often enough to write down.

For anything fuse-related, the authoritative reference is the ATtiny2313 datasheet from Microchip; don't take anecdotal values from the internet at face value.

## Reading current fuses

Before you change fuses, dump what's actually on the chip:

```bash
avrdude -c usbasp -p t2313 \
  -U hfuse:r:-:h \
  -U lfuse:r:-:h
```

`:r:-:h` means read, output to stdout, format as hex. The ATtiny2313 has two fuse bytes, low and high.

## Won't enumerate over USB

If plugging in the freshly-built USBtinyISP produces nothing (no entry in `lsusb` on Linux, no device popup on Windows), walk this list:

1. Measure 5 V across the ATtiny2313 VCC and GND pins. If it's well below 5 V, the USB cable, a blown polyfuse, or the regulator is suspect.
2. Check the crystal is actually oscillating. With a scope, probe XTAL1 or XTAL2. Without a scope, swap the crystal and the two 22 pF loading caps - a cracked or wrong-value cap is the most common silent failure.
3. Confirm the firmware was flashed with the correct fuses for external crystal operation. The internal RC oscillator is too slow and too imprecise for the USB timing the USBtinyISP firmware relies on.
4. Check D+ and D- aren't swapped. On a hand-wired or perfboard build this is an easy mistake.
5. Try a different cable and a different host port. Cheap USB cables and flaky hubs are responsible for more "dead board" reports than actual dead boards.

## A useful avrdude flag

```bash
# Back up the full flash of a working board before touching fuses.
avrdude -c usbtiny -p t2313 -U flash:r:backup.hex:i
```

For everything else, the [Adafruit USBtinyISP guide](https://learn.adafruit.com/usbtinyisp) is a good second reference.
