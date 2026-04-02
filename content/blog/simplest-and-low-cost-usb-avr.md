---
title: "AVR Programming Made Easy: How to Build a USBtinyISP"
date: 2012-07-04T19:39:00+05:30
author: Prabeesh Keezhathra
tags: [AVR, USBtinyISP, attiny2313, microcontroller, embedded systems, usbasp programmer, atmel avr, avr programmer usb]
keywords: avr programmer, avr microcontroller, atmel microcontroller, atmel avr, attiny programmer, usbasp programmer, atmel attiny, usb asp, atmel 32 bit microcontroller, usb avr, usbtinyisp, atmel avr microcontroller, atmel programmer, atmel avr programmer, atmega 8, programming avr microcontrollers, atmel attiny85, diy avr programmer, avr programmer usb, make avr, avr chips, avr in microcontroller, usb tiny isp programmer, atmega8 programmer, avr serial programmer, c avr
description: Complete guide to building a DIY AVR programmer using USBtinyISP. Learn how to program Atmel AVR microcontrollers including ATtiny and ATmega8 with this low-cost USB AVR programmer. Perfect for programming AVR microcontrollers and embedded systems development.
---

**Atmel AVR microcontrollers** are the backbone of countless embedded systems projects, from simple robotics to complex IoT devices. These **avr chips** offer an unbeatable combination of low cost, versatility, and efficient resource utilization that makes them the go-to choice for developers worldwide. Whether you're working with an **ATtiny85**, **ATmega8**, or any other **Atmel microcontroller**, you'll need a reliable **AVR programmer** to upload your code.

## Why Choose USBtinyISP as Your AVR Programmer?

The **USBtinyISP** stands out as the perfect **DIY AVR programmer** solution for both beginners and experienced developers. This **USB AVR programmer** is built around the **ATtiny2313** microcontroller, making it an excellent example of **Atmel AVR** versatility - using one **AVR microcontroller** to program others!

### Key Benefits of This USB Tiny ISP Programmer:
- **Low-cost AVR programmer** solution
- Compatible with most **Atmel AVR microcontrollers**
- Functions as both **USBasp programmer** and **Atmel AVR programmer**
- Perfect for **programming AVR microcontrollers** including **ATtiny** series and **ATmega8**
- Supports **C AVR** development workflows

This **Atmel ATtiny** based programmer can handle everything from simple **ATtiny programmer** tasks to more complex **ATmega8 programmer** operations, making it your one-stop solution for **AVR in microcontroller** programming.

## Building Your USBtinyISP: Step-by-Step Guide

To **make AVR** programming accessible and affordable, follow this comprehensive guide for building your own **USB AVR programmer**. This **Atmel programmer** will serve all your **AVR microcontroller** programming needs.

### Components You'll Need:
- **ATtiny2313** microcontroller (the heart of your **USB ASP** programmer)
- Standard electronic components (resistors, capacitors, USB connector)
- PCB or breadboard for prototyping

The schematic diagram below shows the complete circuit for your **USBtinyISP programmer**. Pay careful attention to the connections, as proper wiring is crucial for reliable **AVR serial programmer** functionality.

Refer to [this comprehensive Adafruit guide](https://learn.adafruit.com/usbtinyisp) for detailed instructions on programming the **ATtiny2313** with the USBtinyISP firmware.

![USB tiny circuit](/images/usbtiny_circuit.png)

## Configuring Fuse Bits for Your Atmel AVR Programmer

Proper fuse bit configuration is essential for any **Atmel AVR programmer** to function correctly. These special configuration bits control the behavior of your **AVR microcontroller** and must be set precisely for optimal **USBtinyISP** operation.

### Setting Fuse Bits with AVRdude

Use the following command to configure your **ATtiny programmer**:

```bash
avrdude -c usbasp -p t2313 -U hfuse:w:0xdf:m -U lfuse:w:0xef:m
```

**Important Note:** If you're using a **serial programmer** connection instead of **USB ASP**, replace `usbasp` with `stk200` in the command above.

This fuse bit configuration ensures your **USB tiny ISP programmer** will work reliably with all supported **Atmel microcontrollers**.

## Programming AVR Microcontrollers with Your USBtinyISP

Once your **AVR programmer USB** device is configured, you're ready to start **programming AVR microcontrollers**! This versatile **Atmel AVR programmer** supports a wide range of targets:

### Supported Microcontrollers:
- **ATtiny** series (ATtiny85, ATtiny13, ATtiny2313, etc.)
- **ATmega** series (**ATmega8**, ATmega328P, ATmega32, etc.)
- Most 8-bit **Atmel AVR microcontrollers**
- Selected **Atmel 32-bit microcontrollers** (check compatibility)

### Programming Process:
1. Connect your target **AVR microcontroller** to the **USBasp programmer**
2. Use AVRdude or your preferred **C AVR** development environment
3. Upload your compiled code to the **avr chips**

This **USB AVR** solution integrates seamlessly with popular development environments, making it perfect for **AVR in microcontroller** projects of any complexity.

## Real-World Results: My USBtinyISP Build

Here are photos of the actual **DIY AVR programmer** I constructed using this guide:

![](/images/040720129881.jpeg)
![](/images/04072012989.jpeg)

## Why USBtinyISP is the Ultimate AVR Programmer Solution

This **USBasp programmer** design represents the perfect balance of simplicity, cost-effectiveness, and functionality for **Atmel AVR** development. Whether you're a student learning **AVR microcontroller** basics or a professional working on complex embedded systems, this **USB ASP** programmer delivers consistent results.

### Key Advantages:
- **Low-cost** alternative to commercial **AVR programmer** solutions
- **DIY-friendly** design perfect for learning **AVR programming**
- Compatible with standard **Atmel microcontroller** development tools
- Supports both **ATtiny** and **ATmega** series microcontrollers
- Reliable **USB AVR** connectivity

The compact design and efficient **Atmel ATtiny** based architecture make this **USB tiny ISP programmer** an essential tool for anyone serious about **AVR microcontroller** development. From simple **ATtiny85** projects to complex **ATmega8 programmer** applications, this versatile **Atmel programmer** handles them all.

Ready to start your **AVR programming** journey? This **USB AVR programmer** is your gateway to the exciting world of **Atmel AVR microcontrollers** and embedded systems development!
