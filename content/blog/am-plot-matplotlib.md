---
title: "Generating and Plotting an AM Wave with Matplotlib"
date: 2011-09-25T1:39:00+05:30
author: Prabeesh Keezhathra
tags: [Python, Matplotlib]
keywords:
  - amplitude modulation
  - AM generation
  - Matplotlib Python
  - signal processing
  - analog communication
description: Generate and plot an AM wave in Python with NumPy and Matplotlib, with carrier and message frequency parameters you can adjust.
---
Amplitude Modulation (AM) is a type of analog communication in which the amplitude of a carrier signal is varied in proportion to the message signal. It's one of the oldest and most widely used forms of radio communication, still used in AM broadcasting and some aviation and military systems.

This post generates and plots an AM wave in Python, using NumPy for the math and Matplotlib for the plot. Familiarity with basic Python is useful; signal-processing knowledge isn't required.

## The approach

Import `matplotlib.pylab` and `numpy`, define the carrier frequency `fc`, the message frequency `fm`, and a time array `t`. Generate the carrier and message signals with NumPy's `sin`, multiply them together to form the AM signal, and plot the result.

## The code

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

This produces an AM wave with a 50 Hz carrier and a 5 Hz message, plotted via Matplotlib:

![AM waveform plotted in Matplotlib with a 50 Hz carrier and 5 Hz message signal](/images/am.png)

## Next steps

For more on Matplotlib, see the [Matplotlib Artist tutorial](https://matplotlib.org/stable/tutorials/artists.html). From here, try adjusting `fc` and `fm` to see how the carrier and message frequencies interact, or add noise to the signal and see how the plot changes.
