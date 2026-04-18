---
title: "Advanced AM Modulation Analysis with Matplotlib"
date: 2024-01-25T10:00:00+01:00
draft: false
tags:
  - Python
  - Matplotlib
  - AM modulation
  - signal processing
  - FFT
keywords:
  - AM modulation analysis
  - matplotlib signal processing
  - FFT in Python
  - sideband analysis
  - modulation index
description: Go beyond basic AM waveforms. Build a Matplotlib + NumPy analyzer that measures modulation index, inspects sidebands via FFT, and handles noise.
---

This post builds on [AM Wave Generation and Plotting with Matplotlib](/blog/2011/09/25/am-plot-matplotlib/). Once you can generate an AM waveform, the interesting question is: is it any good? That means measuring modulation index and inspecting the spectrum. Below is a small `AdvancedAMAnalyzer` class that handles both, plus a worked example of how sideband power redistributes with the modulation index.

## A reusable analyzer class

The class holds the sample rate and duration, and exposes three operations: generate a signal, calculate the modulation index from the envelope, and analyze the sideband spectrum via FFT.

```python
import matplotlib.pyplot as plt
import numpy as np
from scipy import signal
from scipy.fft import fft, fftfreq

class AdvancedAMAnalyzer:
    """AM signal analysis: modulation index and sideband spectrum."""
    
    def __init__(self, sampling_rate=10000, duration=1.0):
        self.sampling_rate = sampling_rate
        self.duration = duration
        self.time = np.linspace(0, duration, int(sampling_rate * duration))
        
    def generate_am_signal(self, carrier_freq, message_freq, modulation_index, 
                          message_amplitude=1.0, carrier_amplitude=1.0, 
                          noise_level=0.0):
        """Generate an AM signal with optional additive Gaussian noise."""
        carrier = carrier_amplitude * np.sin(2 * np.pi * carrier_freq * self.time)
        message = message_amplitude * np.sin(2 * np.pi * message_freq * self.time)
        
        am_signal = carrier * (1 + modulation_index * message)
        
        if noise_level > 0:
            am_signal += noise_level * np.random.normal(0, 1, len(self.time))
            
        return am_signal, carrier, message
    
    def calculate_modulation_index(self, am_signal):
        """Estimate modulation index from the signal envelope (Hilbert transform)."""
        envelope = np.abs(signal.hilbert(am_signal))
        max_env = np.max(envelope)
        min_env = np.min(envelope)
        m = (max_env - min_env) / (max_env + min_env)
        return m, envelope
    
    def analyze_sidebands(self, am_signal, carrier_freq, message_freq):
        """FFT-based power at the carrier and the two sideband frequencies."""
        fft_signal = fft(am_signal)
        freqs = fftfreq(len(self.time), 1 / self.sampling_rate)
        
        def power_at(f):
            idx = np.argmin(np.abs(freqs - f))
            return np.abs(fft_signal[idx]) ** 2
        
        carrier_power  = power_at(carrier_freq)
        upper_sb_power = power_at(carrier_freq + message_freq)
        lower_sb_power = power_at(carrier_freq - message_freq)
        
        return {
            'frequencies': freqs,
            'fft_signal': fft_signal,
            'carrier_power': carrier_power,
            'upper_sideband_power': upper_sb_power,
            'lower_sideband_power': lower_sb_power,
            'total_power': carrier_power + upper_sb_power + lower_sb_power,
        }

analyzer = AdvancedAMAnalyzer(sampling_rate=10000, duration=1.0)
```

The envelope is recovered with `scipy.signal.hilbert`, which returns the analytic signal; the absolute value of that is the amplitude envelope. The modulation index formula `(max - min) / (max + min)` then falls straight out of the definition of AM: the envelope varies between `A(1 - m)` and `A(1 + m)`.

For the spectrum, a plain `fft` + `fftfreq` pair gives you the frequency bins. Pick the bins closest to the carrier and the two sidebands (`f_c ± f_m`) and square the magnitudes to get power.

## Modulation index examples

The modulation index `m` controls how deeply the message modulates the carrier. Below `m = 1.0` the envelope stays positive; at `m = 1.0` it just touches zero; above `m = 1.0` the envelope flips sign and you get phase reversals that most receivers won't demodulate cleanly. The function below plots several indices side by side, showing both the time-domain envelope and the frequency spectrum.

```python
def analyze_modulation_depth_examples():
    modulation_indices = [0.25, 0.5, 0.75, 1.0, 1.25]
    carrier_freq, message_freq = 1000, 100
    
    fig, axes = plt.subplots(len(modulation_indices), 2, figsize=(15, 12))
    fig.suptitle('AM Signal Analysis: Different Modulation Indices', fontsize=16)
    
    for i, mi in enumerate(modulation_indices):
        am_signal, _, _ = analyzer.generate_am_signal(carrier_freq, message_freq, mi)
        calculated_mi, envelope = analyzer.calculate_modulation_index(am_signal)
        
        # Time domain
        axes[i, 0].plot(analyzer.time[:1000], am_signal[:1000], 'b-', label=f'AM Signal (MI={mi:.2f})')
        axes[i, 0].plot(analyzer.time[:1000], envelope[:1000], 'r--', label=f'Envelope (Calculated MI={calculated_mi:.3f})')
        axes[i, 0].set_title(f'Modulation Index: {mi}')
        axes[i, 0].set_xlabel('Time (s)')
        axes[i, 0].set_ylabel('Amplitude')
        axes[i, 0].legend()
        axes[i, 0].grid(True)
        
        # Frequency domain (positive frequencies only)
        sb = analyzer.analyze_sidebands(am_signal, carrier_freq, message_freq)
        freqs = sb['frequencies']
        mag   = np.abs(sb['fft_signal'])
        mask  = freqs >= 0
        
        axes[i, 1].plot(freqs[mask], mag[mask], 'g-')
        axes[i, 1].set_title(f'Frequency Spectrum (MI={mi})')
        axes[i, 1].set_xlabel('Frequency (Hz)')
        axes[i, 1].set_ylabel('Magnitude')
        axes[i, 1].set_xlim(0, 2000)
        axes[i, 1].grid(True)
    
    plt.tight_layout()
    plt.show()

analyze_modulation_depth_examples()
```

Two things to watch in the output: for `m ≤ 1` the red envelope curve stays above zero, and the spectrum shows a clean carrier with two small sidebands. For `m > 1` (overmodulation), the envelope crosses zero and the spectrum gains extra harmonic components that aren't in the original message, visible audio distortion on a real receiver.

## Sideband power distribution

In AM, the total transmitted power splits between the carrier and the two sidebands. The carrier carries no information, so the share of power in the sidebands is a direct measure of transmission efficiency. Theory says the sideband power scales with `m² / 2` relative to carrier power; this function sweeps the modulation index and plots the result.

```python
def sideband_power_analysis():
    carrier_freq, message_freq = 1000, 100
    modulation_indices = np.linspace(0.1, 1.5, 20)
    
    carrier_powers  = []
    sideband_powers = []
    total_powers    = []
    
    for mi in modulation_indices:
        am_signal, _, _ = analyzer.generate_am_signal(carrier_freq, message_freq, mi)
        a = analyzer.analyze_sidebands(am_signal, carrier_freq, message_freq)
        
        carrier_powers.append(a['carrier_power'])
        sideband_powers.append(a['upper_sideband_power'] + a['lower_sideband_power'])
        total_powers.append(a['total_power'])
    
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))
    
    # Power vs modulation index
    ax1.plot(modulation_indices, carrier_powers,  'b-', label='Carrier', linewidth=2)
    ax1.plot(modulation_indices, sideband_powers, 'r-', label='Sidebands', linewidth=2)
    ax1.plot(modulation_indices, total_powers,    'g-', label='Total', linewidth=2)
    ax1.set_xlabel('Modulation Index')
    ax1.set_ylabel('Power')
    ax1.set_title('Power Distribution vs Modulation Index')
    ax1.legend()
    ax1.grid(True)
    
    # Sideband efficiency
    efficiency = np.array(sideband_powers) / np.array(total_powers) * 100
    ax2.plot(modulation_indices, efficiency, color='purple', linewidth=2)
    ax2.set_xlabel('Modulation Index')
    ax2.set_ylabel('Sideband Efficiency (%)')
    ax2.set_title('Share of Total Power in Sidebands')
    ax2.grid(True)
    
    plt.tight_layout()
    plt.show()

sideband_power_analysis()
```

The efficiency curve confirms the textbook result: at `m = 1.0`, only about 33% of the total power is in the sidebands (the useful part); the rest is in the carrier. That's why commercial AM systems sometimes use variants (SSB, DSB-SC) that suppress part or all of the carrier.

## Summary

With `numpy`, `scipy.signal`, and `scipy.fft`, the two core measurements for an AM signal, modulation index from the envelope and power distribution via FFT, take only a few dozen lines. The same envelope-detection and spectrum-inspection approach also works for demodulating real recordings, for example from an SDR capture, as long as you resample down to a manageable rate first.

For the starting point, see [AM Wave Generation and Plotting](/blog/2011/09/25/am-plot-matplotlib/).
