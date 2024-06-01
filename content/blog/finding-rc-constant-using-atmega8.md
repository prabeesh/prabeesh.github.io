---
title: "Finding RC constant using ATmega8"
date: 2012-07-14T23:39:00+05:30
tags: [AVR, Embedded]
keywords: time constant using AVR, atmega8 examples, time constant using embedded systems, find RC constant, find RC constant using microcontroller, AVR find RC constant, AVR find RC
description: This blog post explores the process of finding RC constants using the ATmega8 microcontroller. It provides an overview of the concept of RC time constants and explains how to measure them using the ADC of the ATmega8. The code example demonstrates how to calculate the RC constant and display it on an LCD screen. The post includes test examples with different resistor and capacitor values to showcase the practical application of the method. Overall, it serves as a comprehensive guide for anyone interested in understanding and implementing RC constant calculations with the ATmega8 microcontroller.
---

The time constant(sec) of an RC circuit is equal to the product of the resistance and the capacitance of the circuit.

It is the time required to charge the capacitor through the resistor to 63. 2% of full charge,or to discharge it to 36.8% of its initial voltage.

The voltage of the RC circuit is measured using adc of the ATmega8, input voltage for RC circuit is given from PB0. The timer is started at the time of the PB0 making 1 .

The adc of ATmega8(ADCH) is 8 bit long so corresponding to 5V get 255 in ADCH. The TCNT1 value is taken to a variable when the output voltage of the RC circuit become 63.2% of the input voltage.That is  3.16 v corresponding to these voltage ADCH show 161(appr).

Using an LCD can show the TCNT1 value. TCNT1 is 16 bit long.Here ATmega8 running in 8MHz clock,timer prescaled by 1024.

So if you get the real time multiply the TCNT1 value to (1024/8000000).

Some test examples: <!--more-->
```
	 R=1kΩ  C=100µF  the calculated RC constant is 0.1S.
```
The value of  TCNT1 is 846.Which is equal to 0.108288s.
```
	 R=2kΩ  C=100µF  the calculated RC constant is 0.2S.
```
The value of  TCNT1 is 1864.Which is equal to 0.238592s.


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
