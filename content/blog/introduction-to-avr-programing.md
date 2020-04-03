---
title: "Introduction to AVR programming"
date: 2012-02-21T2:39:00+05:30
tags: [AVR, Embedded]
keywords: beginners guide AVR programming, AVR programming basic examples, intro to AVR programming, avr introduction, beginner avr examples, how to avr programs, avr examples, basic avr code
description: Beginner level AVR programming introduction 
---

Atmel AVR 8-bit and 32-bit microcontrollers deliver a unique combination of performance, power efficiency, and design flexibility. Optimized to speed time to market, they are based on the industry’s most code-efficient architecture for C and assembly programming. No other microcontrollers deliver more computing performance with better power efficiency. Industry-leading development tools and design support let you get to market faster. Once there, the large AVR family lets you reuse your knowledge when improving your products and expanding to new markets—easily and cost-effectively.

package required in linux

binutils: Programs to manipulate binary and object files that may have been created for Atmel’s AVR architecture. This package is primarily for AVR developers and cross-compilers.

gcc-avr: The GNU C compiler, a fairly portable optimising compiler that supports multiple languages. This package includes C language support.

avr-libc: Standard library used for developing C programs for Atmel AVR microcontrollers. This package contains static libraries, as well as needed header files.

sample programme to blink  a LED. <!--more-->

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
save th above program to a file led.c

Then compile the program using avr-gcc and convert the c-code into object code as follows
```c
avr-gcc -mmcu=atmega8  led.c -o led.o
```
in next step convert the led.o object code to hex-code
```c
avr-objcopy -j .text -j .data -O  ihex  led.o  led.hex
```
in final step using USBASP we can write program  to avr
```c
avrdude -c usbasp -p m8 -U flash:w:led.hex:a
```
for more details about USBASP [visit](http://achuwilson.wordpress.com/2011/12/15/usbasp-a-usb-programmer-for-avr-microcontrollers/)

####Code Explanation

The GNU C compiler for the Atmel family identifies all functional units within the microcontroller with meaningful names. Thus, writing `PORTC=0xff’ will result in the compiler generating machine code that writes 0xff to I/O port C, which will set all port C pins to logic high. Because ports are bidirectional, we must decide whether each pin should act as input or output. If the i’th bit of a register called DDRC (data direction register C) is 1, then the i’th pin of PORTC’s i’th pin will be an output. Otherwise, it will act as an input pin. (Note that pin and bit numbers start at zero.) To make a LED blink, you have to make a pin high, then low. (Here, we use PORTC’s 2nd port. That is, PC2 will be the 25th pin.) There should be a delay between the two. This is what the rest of the code does.
