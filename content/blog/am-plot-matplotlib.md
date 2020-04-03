---
title: "AM Generation using Matplotlib Python"
date: 2011-09-25T1:39:00+05:30
tags: [Python, Matplotlib]
keywords: matlab in linux, matplotlib examples, AM genaration matplot lib, how to matplot lib AM generataion, AM matplot lib examples, matlab linux AM generation, matlab equivalent in linux, Amplitude modulation in linux
description: AM generation uisng matplotlib Python library in linux, matlab quivalent in linux
---
we can plot AM waves using matplotlib

It is the one of the most strongest tool in linux to plot the waves

```python
import matplotlib.pylab as plt
import numpy as num
fc=50;
fm=5;
t=num.arange(0,1,0.001);
c=num.sin(2*num.pi*fc*t);
m=num.sin(2*num.pi*fm*t);     
am=c*(2+m);
plt.plot(am,’r’)
plt.show()
```
{% img center /images/am.png 600 350 'image' 'images' %}

<!--more-->

For more details about matplotlib [refer](http://matplotlib.sourceforge.net/users/artists.html)
