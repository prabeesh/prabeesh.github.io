---
title: "AM Wave Generation and Plotting with Matplotlib Python: A Detailed Guide"
date: 2011-09-25T1:39:00+05:30
author: Prabeesh Keezhathra
tags: [Python, Matplotlib]
keywords: Amplitude Modulation, AM generation, Matplotlib Python, Plot AM waves, Linux, Matlab equivalent, Data visualization, Signal processing, Python library, Analog communication, Carrier signal, Message signal, Radio communication, AM radio broadcasting, Military communication, Aviation communication, Matlab in Linux, Matplotlib examples, AM generation Matplotlib, How to Matplotlib AM generation, AM Matplotlib examples, Matlab Linux AM generation, Matlab equivalent in Linux, Amplitude Modulation in Linux, Data visualization with Matplotlib, Signal processing with Matplotlib, Python library for AM generation, Analog communication with Matplotlib, Carrier signal with Matplotlib, Message signal with Matplotlib, Radio communication with Matplotlib, AM radio broadcasting with Matplotlib
description: Learn how to generate and plot Amplitude Modulation (AM) waves using the powerful Matplotlib Python library. This tutorial shows you how to use Matplotlib to create AM waves with a specified carrier frequency and message frequency, and how to customize the appearance of the plot. Whether you're a beginner or an experienced developer, this guide will help you get started with AM generation using Matplotlib in Linux. Explore a range of examples and discover the full potential of Matplotlib for data visualization and signal processing in Linux.
---
Amplitude Modulation (AM) is a type of analog communication in which the amplitude of a carrier signal is varied in proportion to the message signal. It is one of the oldest and most widely used forms of radio communication, and it is still used in many applications today, including AM radio broadcasting and certain types of military and aviation communications.

In this blog post, we will learn how to generate and plot AM waves using the Python library Matplotlib. Matplotlib is a powerful tool for creating visualizations of data and is widely used in scientific and engineering applications. We will use it to plot an AM wave with a specified carrier frequency and message frequency, and learn how to customize the appearance of the plot. This tutorial is designed for beginners, but some familiarity with Python and basic concepts in signal processing will be helpful.

To plot AM waves using Matplotlib, we need to first import the `matplotlib.pylab` module and the `numpy` module, which provides support for numerical operations. We then define the carrier frequency `fc`, the message frequency `fm`, and the time array `t`. Next, we generate the carrier signal `c` and the message signal `m` using the sin function from the numpy module. Finally, we multiply the carrier signal by the message signal to obtain the AM signal, and plot it using the `plot` function from the `matplotlib.pylab` module.

```Python
# Import the matplotlib.pylab and numpy modules
import matplotlib.pylab as plt
import numpy as np

# Set the carrier frequency and message frequency
fc = 50
fm = 5

# Generate the time array
t = np.arange(0, 1, 0.001)

# Generate the carrier signal
c = np.sin(2 * np.pi * fc * t)

# Generate the message signal
m = np.sin(2 * np.pi * fm * t)

# Generate the AM signal
am = c * (2 + m)

# Plot the AM signal
plt.plot(am, 'r')
plt.show()
```
This code will generate an AM wave with a carrier frequency of 50 Hz and a message frequency of 5 Hz, and plot it using Matplotlib. The plot will be displayed using the show function from the matplotlib.pylab module. The resulting plot should look something like the one shown below.

![](/images/am.png)

For more details about matplotlib [refer](http://matplotlib.sourceforge.net/users/artists.html)

This post has hopefully helped you learn how to generate and plot AM waves using the Matplotlib library in Python. With the skills and knowledge you have gained from this tutorial, you can now start creating your own AM wave plots and exploring the full range of features and capabilities offered by Matplotlib. Whether you are a beginner or an experienced developer, this post should have provided you with a basic foundation for using Matplotlib to create beautiful and informative visualizations of data.
