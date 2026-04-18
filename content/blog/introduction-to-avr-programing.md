---
title: "Introduction to AVR Microcontroller Programming"
date: 2012-02-21T2:39:00+05:30
author: Prabeesh Keezhathra
tags: [AVR, Embedded Systems, Microcontroller Programming, Atmel, C Programming]
keywords:
  - AVR programming tutorial
  - Atmel microcontroller programming
  - AVR development setup
  - AVR-GCC compiler
  - embedded C programming
  - AVR LED blink program
  - USBASP programmer
  - microcontroller development tools
description: Get started with AVR microcontroller programming. Walks through toolchain setup, AVR-GCC, flashing with USBASP, and a first LED blink program.
---

The Atmel AVR family covers 8-bit and 32-bit microcontrollers with a compact instruction set that maps well to C. The chips are cheap, the toolchain is free (GCC-based), and a USB programmer like the USBasp lets you flash code in seconds. This post walks through setting up the Linux toolchain and flashing a first LED-blink program.

## Packages required on Linux

- `binutils-avr`: assembler, linker, and object-file utilities targeting the AVR architecture.
- `gcc-avr`: the GNU C cross-compiler for AVR.
- `avr-libc`: C standard library, startup code, and header files for AVR targets.

## Sample program: blink an LED

<!--more-->

```c
#include<avr/io.h>
#include<util/delay.h>
main()
{

        DDRC |=1<<PC2;  /* PC2 will now be the output pin */
        while(1)
        {
                PORTC &= ~(1<<PC2);/* PC2 LOW */
               _delay_ms(10);
                PORTC |=(1<<PC2); /* PC2 HIGH */
               _delay_ms(10);
        }
}
```
Save the above program to a file `led.c`.

Then compile the program using avr-gcc and convert the C code into object code:
```c
avr-gcc -mmcu=atmega8  led.c -o led.o
```
In the next step, convert the `led.o` object code to hex:
```c
avr-objcopy -j .text -j .data -O  ihex  led.o  led.hex
```
In the final step, use USBASP to write the program to the AVR:
```c
avrdude -c usbasp -p m8 -U flash:w:led.hex:a
```
For more details about USBASP, [visit this guide](http://achuwilson.wordpress.com/2011/12/15/usbasp-a-usb-programmer-for-avr-microcontrollers/).

## Code explanation

The GNU C compiler for the Atmel family identifies all functional units within the microcontroller with meaningful names. Writing `PORTC=0xff` makes the compiler generate machine code that writes 0xff to I/O port C, setting all port C pins to logic high. Because ports are bidirectional, you must decide whether each pin should act as input or output. If the i-th bit of the DDRC register (data direction register C) is 1, the i-th pin of PORTC will be an output; otherwise it acts as an input. (Pin and bit numbers start at zero.) To blink an LED you drive a pin high, then low. Here we use PORTC's 2nd port, PC2, which maps to physical pin 25. The `_delay_ms()` calls from `<util/delay.h>` insert a timed pause between the two states.
