---
title: "Measuring an RC Time Constant with an ATmega8"
date: 2012-07-14T23:39:00+05:30
tags:
  - AVR
  - ATmega8
  - embedded systems
  - ADC
keywords:
  - RC time constant AVR
  - ATmega8 ADC
  - measuring capacitance microcontroller
description: Measure an RC time constant in hardware using the ATmega8's ADC and timer. Covers the circuit, the C code, and a couple of test runs with different R-C values.
---

The time constant of an RC circuit equals `R * C` (in seconds). It is the time for the capacitor to charge through the resistor to 63.2% of the supply voltage, or to discharge to 36.8% of its starting level.

## Approach

The ATmega8's ADC samples the voltage across the capacitor continuously. A digital output pin (PB0) supplies the input voltage to the RC network. The moment PB0 goes high, Timer1 starts counting. When the ADC reading hits 63.2% of the rail (roughly 161 out of 255 for a 5 V supply), we capture the timer value.

Timer1 is a 16-bit counter, clocked at 8 MHz with a 1024 prescaler. To convert timer ticks to seconds, multiply by `1024 / 8000000`. An LCD shows both the raw tick count and the ADC reading.

## Test results
<!--more-->

| R | C | Calculated RC | Timer ticks | Measured RC |
| --- | --- | --- | --- | --- |
| 1 kOhm | 100 uF | 0.100 s | 846 | 0.108 s |
| 2 kOhm | 100 uF | 0.200 s | 1864 | 0.239 s |

Both within ~20% of the ideal value, which is typical for low-precision components.

## Code


```c

#include<avr/io.h>
#define F_CPU 8000000UL
#include <util/delay.h>

#define RS 6 //PD6
#define EN 7 //PD7
#define databits PORTC //PC0 to PC3
#define row1 cmd(0x80)
#define row2 cmd(0xc0)

void adc_init()
{
   //select AVCC reference voltage , left alignment of data and ADC4
   ADMUX=((1<<REFS0)|(1<<ADLAR)|(1<<MUX2));

   //enable ADC, set prescaler to divide the clock by 64 and auto triggering mode
   ADCSRA=((1<<ADEN)|(1<<ADFR)|(1<<ADPS2)|(1<<ADPS1)|(1<<ADPS0));

}

void conversion()
{
   //start conversion
   ADCSRA|=(1<<ADSC);
}

void port_init()
{
   DDRC = 0xcf;
   DDRD = (1 << RS)|(1 << EN);
}

void LCD_STROBE(void)
{
   PORTD |= (1 << EN);
   _delay_us(1);
   PORTD &= ~(1 << EN);
}

void data(unsigned char c)
{
   PORTD |= (1 << RS);
   _delay_us(50);
   databits = (c >> 4);
   LCD_STROBE();
   databits = (c);
   LCD_STROBE();
}

void cmd(unsigned char c)
{
   PORTD &= ~(1 << RS);
   _delay_us(50);
   databits = (c >> 4);
   LCD_STROBE();
   databits = (c);
   LCD_STROBE();
}

void clear(void)
{
   cmd(0x01);
   _delay_ms(5);
}

void lcd_init()
{
   _delay_ms(15);
   cmd(0x30);
   _delay_ms(1);
   cmd(0x30);
   _delay_us(100);
   cmd(0x30);
   cmd(0x28); // Function set (4-bit interface, 2 lines, 5*7Pixels)
   cmd(0x28); // Function set (4-bit interface, 2 lines, 5*7Pixels)
   cmd(0x0c); // Make cursorinvisible
   clear(); // Clear screen
   cmd(0x6); // Set entry Mode(auto increment of cursor)
}

void print(char *p)
{
   while(*p) data(*p++);
}

void main()
{
   char a[5],b[5];
   int c,d; 
   DDRB=0x01;
   _delay_ms(50);
   TCCR1B|=(1<<CS10)|(1<<CS12);//prescale 1024
   port_init();
   adc_init();
   lcd_init();
   PORTB=0x01;//applying vcc to RC circuit
   TCNT1=0x00;//start the timer

   while(1)
   { 
      conversion();

      while(!( ADIF));

      if(ADCH==161)//63% of the input voltage
      { 
         c=TCNT1; 
         d=ADCH;
         itoa(c,a,10);//integer to ASCII
         itoa(d,b,10);//integer to ASCII
         row1; 
         print(a);//showing timer value
         row2;
         print(b);//showing adc value
      }
   } 
}
```
