---
title: "AM Wave Generation and Plotting with Matplotlib Python: A Detailed Guide"
date: 2011-09-25T1:39:00+05:30
author: Prabeesh Keezhathra
tags: [Python, Matplotlib]
keywords:
  - amplitude modulation
  - AM generation
  - Matplotlib Python
  - signal processing
  - data visualization
  - analog communication
  - carrier signal
  - Matlab equivalent Linux
description: Generate and plot an AM wave in Python with NumPy and Matplotlib, with carrier and message frequency parameters you can adjust.
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

![AM waveform plotted in Matplotlib with a 50 Hz carrier and 5 Hz message signal](/images/am.png)

For more details about matplotlib, see the [Matplotlib Artist tutorial](https://matplotlib.org/stable/tutorials/artists.html).

From here, try adjusting `fc` and `fm` to see how the carrier and message frequencies interact, or add noise to the signal and see how the plot changes.
