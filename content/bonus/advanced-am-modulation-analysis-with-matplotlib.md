---
title: "Advanced AM Modulation Analysis with Matplotlib: Real-World Applications and Advanced Techniques"
date: 2024-01-25T10:00:00+01:00
draft: false
tags: [Python, Matplotlib, AM modulation, signal processing, advanced visualization, frequency analysis, modulation index, sideband analysis, real-world applications, radio communication, signal quality, modulation depth, carrier power, sideband power, spectrum analysis, FFT analysis, modulation efficiency, signal-to-noise ratio, bandwidth analysis, modulation distortion]
keywords: advanced AM modulation matplotlib, AM modulation analysis, signal processing matplotlib, frequency domain analysis, modulation index calculation, sideband analysis matplotlib, real-world AM applications, radio communication analysis, signal quality measurement, modulation depth analysis, carrier power calculation, sideband power analysis, spectrum analysis matplotlib, FFT analysis AM signals, modulation efficiency calculation, signal-to-noise ratio AM, bandwidth analysis AM signals, modulation distortion analysis, AM signal visualization, advanced matplotlib techniques
description: Master advanced AM modulation analysis techniques using Matplotlib. Learn about modulation index calculation, sideband analysis, frequency domain visualization, real-world applications, and signal quality measurements. Build upon basic AM generation with sophisticated analysis and visualization techniques for professional signal processing applications.
---

Building upon our foundational guide on [AM Wave Generation and Plotting with Matplotlib](/blog/2011/09/25/am-plot-matplotlib/), this bonus article explores advanced AM modulation analysis techniques that are essential for real-world signal processing applications. While the original post covered basic AM generation and plotting, this advanced guide delves into modulation index analysis, sideband examination, frequency domain visualization, and practical applications that professionals encounter in radio communication, broadcasting, and signal analysis.

If you haven't read our basic AM generation guide yet, we recommend starting there to understand the fundamentals of amplitude modulation, carrier signals, and basic plotting techniques before diving into these advanced concepts.

## Advanced AM Modulation Analysis Framework

### Comprehensive AM Signal Analysis Class

```python
import matplotlib.pyplot as plt
import numpy as np
from scipy import signal
from scipy.fft import fft, fftfreq
import matplotlib.gridspec as gridspec

class AdvancedAMAnalyzer:
    """Advanced AM signal analysis and visualization framework."""
    
    def __init__(self, sampling_rate=10000, duration=1.0):
        self.sampling_rate = sampling_rate
        self.duration = duration
        self.time = np.linspace(0, duration, int(sampling_rate * duration))
        
    def generate_am_signal(self, carrier_freq, message_freq, modulation_index, 
                          message_amplitude=1.0, carrier_amplitude=1.0, 
                          noise_level=0.0):
        """Generate AM signal with specified parameters and optional noise."""
        
        # Generate carrier and message signals
        carrier = carrier_amplitude * np.sin(2 * np.pi * carrier_freq * self.time)
        message = message_amplitude * np.sin(2 * np.pi * message_freq * self.time)
        
        # Apply modulation index
        am_signal = carrier * (1 + modulation_index * message)
        
        # Add noise if specified
        if noise_level > 0:
            noise = noise_level * np.random.normal(0, 1, len(self.time))
            am_signal += noise
            
        return am_signal, carrier, message
    
    def calculate_modulation_index(self, am_signal, carrier_signal):
        """Calculate modulation index from signal analysis."""
        # Envelope detection
        envelope = np.abs(signal.hilbert(am_signal))
        
        # Calculate modulation index
        max_envelope = np.max(envelope)
        min_envelope = np.min(envelope)
        
        modulation_index = (max_envelope - min_envelope) / (max_envelope + min_envelope)
        return modulation_index, envelope
    
    def analyze_sidebands(self, am_signal, carrier_freq, message_freq):
        """Analyze sideband components and power distribution."""
        # Perform FFT
        fft_signal = fft(am_signal)
        freqs = fftfreq(len(self.time), 1/self.sampling_rate)
        
        # Find carrier and sideband frequencies
        carrier_idx = np.argmin(np.abs(freqs - carrier_freq))
        upper_sideband_idx = np.argmin(np.abs(freqs - (carrier_freq + message_freq)))
        lower_sideband_idx = np.argmin(np.abs(freqs - (carrier_freq - message_freq)))
        
        # Calculate power in each component
        carrier_power = np.abs(fft_signal[carrier_idx])**2
        upper_sideband_power = np.abs(fft_signal[upper_sideband_idx])**2
        lower_sideband_power = np.abs(fft_signal[lower_sideband_idx])**2
        
        return {
            'frequencies': freqs,
            'fft_signal': fft_signal,
            'carrier_power': carrier_power,
            'upper_sideband_power': upper_sideband_power,
            'lower_sideband_power': lower_sideband_power,
            'total_power': carrier_power + upper_sideband_power + lower_sideband_power
        }
    
    def calculate_signal_quality_metrics(self, am_signal, original_message):
        """Calculate signal quality metrics including SNR and distortion."""
        # Calculate SNR
        signal_power = np.mean(am_signal**2)
        noise_power = np.mean((am_signal - original_message)**2)
        snr_db = 10 * np.log10(signal_power / noise_power) if noise_power > 0 else float('inf')
        
        # Calculate distortion
        correlation = np.corrcoef(am_signal, original_message)[0, 1]
        distortion = 1 - abs(correlation)
        
        return {
            'snr_db': snr_db,
            'distortion': distortion,
            'signal_power': signal_power,
            'noise_power': noise_power
        }

# Initialize analyzer
analyzer = AdvancedAMAnalyzer(sampling_rate=10000, duration=1.0)
```

## Real-World AM Signal Analysis

### Modulation Index Analysis and Visualization

```python
def analyze_modulation_depth_examples():
    """Demonstrate different modulation indices and their effects."""
    
    # Test different modulation indices
    modulation_indices = [0.25, 0.5, 0.75, 1.0, 1.25]
    carrier_freq, message_freq = 1000, 100
    
    fig, axes = plt.subplots(len(modulation_indices), 2, figsize=(15, 12))
    fig.suptitle('AM Signal Analysis: Different Modulation Indices', fontsize=16)
    
    for i, mi in enumerate(modulation_indices):
        # Generate AM signal
        am_signal, carrier, message = analyzer.generate_am_signal(
            carrier_freq, message_freq, mi
        )
        
        # Calculate actual modulation index
        calculated_mi, envelope = analyzer.calculate_modulation_index(am_signal, carrier)
        
        # Time domain plot
        axes[i, 0].plot(analyzer.time[:1000], am_signal[:1000], 'b-', label=f'AM Signal (MI={mi:.2f})')
        axes[i, 0].plot(analyzer.time[:1000], envelope[:1000], 'r--', label=f'Envelope (Calculated MI={calculated_mi:.3f})')
        axes[i, 0].set_title(f'Modulation Index: {mi}')
        axes[i, 0].set_xlabel('Time (s)')
        axes[i, 0].set_ylabel('Amplitude')
        axes[i, 0].legend()
        axes[i, 0].grid(True)
        
        # Frequency domain plot
        sideband_analysis = analyzer.analyze_sidebands(am_signal, carrier_freq, message_freq)
        freqs = sideband_analysis['frequencies']
        fft_signal = sideband_analysis['fft_signal']
        
        # Plot only positive frequencies
        positive_freqs = freqs[freqs >= 0]
        positive_fft = np.abs(fft_signal[freqs >= 0])
        
        axes[i, 1].plot(positive_freqs, positive_fft, 'g-')
        axes[i, 1].set_title(f'Frequency Spectrum (MI={mi})')
        axes[i, 1].set_xlabel('Frequency (Hz)')
        axes[i, 1].set_ylabel('Magnitude')
        axes[i, 1].set_xlim(0, 2000)
        axes[i, 1].grid(True)
    
    plt.tight_layout()
    plt.show()

# Run the analysis
analyze_modulation_depth_examples()
```

## Advanced Frequency Domain Analysis

### Sideband Power Distribution Analysis

```python
def sideband_power_analysis():
    """Analyze power distribution in carrier and sidebands."""
    
    carrier_freq, message_freq = 1000, 100
    modulation_indices = np.linspace(0.1, 1.5, 20)
    
    carrier_powers = []
    sideband_powers = []
    total_powers = []
    
    for mi in modulation_indices:
        am_signal, _, _ = analyzer.generate_am_signal(carrier_freq, message_freq, mi)
        analysis = analyzer.analyze_sidebands(am_signal, carrier_freq, message_freq)
        
        carrier_powers.append(analysis['carrier_power'])
        sideband_powers.append(analysis['upper_sideband_power'] + analysis['lower_sideband_power'])
        total_powers.append(analysis['total_power'])
    
    # Create comprehensive visualization
    fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(15, 12))
    fig.suptitle('Advanced AM Signal Power Analysis', fontsize=16)
    
    # Power vs Modulation Index
    ax1.plot(modulation_indices, carrier_powers, 'b-', label='Carrier Power', linewidth=2)
    ax1.plot(modulation_indices, sideband_powers, 'r-', label='Sideband Power', linewidth=2)
    ax1.plot(modulation_indices, total_powers, 'g-', label='Total Power', linewidth=2)
    ax1.set_xlabel('Modulation Index')
    ax1.set_ylabel('Power')
    ax1.set_title('Power Distribution vs Modulation Index')
    ax1.legend()
    ax1.grid(True)
    
    # Power Efficiency
    efficiency = np.array(sideband_powers) / np.array(total_powers) * 100
    ax2.plot(modulation_indices, efficiency, 'purple', linewidth=2)
    ax2.set_xlabel('Modulation Index')
    ax2.set_ylabel('Sideband Efficiency (%)')
    ax2.set_title('Power Efficiency in Sidebands')
    ax2.grid(True)
    
    # Detailed spectrum for specific modulation index
    mi_optimal = 1.0
    am_signal, _, _ = analyzer.generate_am_signal(carrier_freq, message_freq, mi_optimal)
    analysis = analyzer.analyze_sidebands(am_signal, carrier_freq, message_freq)
    
    freqs = analysis['frequencies']
    fft_signal = analysis['fft_signal']
    
    # Plot detailed spectrum
    positive_freqs = freqs[freqs >= 0]
    positive_fft = np.abs(fft_signal[freqs >= 0])
    
    ax3.plot(positive_freqs, positive_fft, 'b-', linewidth=1.5)
    ax3.set_xlabel('Frequency (Hz)')
    ax3.set_ylabel('Magnitude')
    ax3.set_title(f'Detailed Spectrum (MI={mi_optimal})')
    ax3.set_xlim(800, 1200)
    ax3.grid(True)
    
    # Annotate key frequencies
    ax3.axvline(x=carrier_freq, color='red', linestyle='--', alpha=0.7, label='Carrier')
    ax3.axvline(x=carrier_freq + message_freq, color='green', linestyle='--', alpha=0.7, label='Upper Sideband')
    ax3.axvline(x=carrier_freq - message_freq, color='orange', linestyle='--', alpha=0.7, label='Lower Sideband')
    ax3.legend()
    
    # 3D visualization of power distribution
    from mpl_toolkits.mplot3d import Axes3D
    
    # Create meshgrid for 3D plot
    mi_mesh, freq_mesh = np.meshgrid(modulation_indices, positive_freqs[::10])
    
    # Calculate power distribution for each combination
    power_mesh = np.zeros_like(mi_mesh)
    for i, mi in enumerate(modulation_indices):
        am_signal, _, _ = analyzer.generate_am_signal(carrier_freq, message_freq, mi)
        analysis = analyzer.analyze_sidebands(am_signal, carrier_freq, message_freq)
        power_mesh[:, i] = np.abs(analysis['fft_signal'][freqs >= 0][::10])
    
    ax4 = fig.add_subplot(2, 2, 4, projection='3d')
    surf = ax4.plot_surface(mi_mesh, freq_mesh, power_mesh, cmap='viridis', alpha=0.8)
    ax4.set_xlabel('Modulation Index')
    ax4.set_ylabel('Frequency (Hz)')
    ax4.set_zlabel('Power')
    ax4.set_title('3D Power Distribution')
    
    plt.tight_layout()
    plt.show()

# Run sideband analysis
sideband_power_analysis()
```

## Real-World Applications and Case Studies

### AM Broadcasting Signal Analysis

```python
def am_broadcasting_analysis():
    """Simulate and analyze AM broadcasting signals with real-world parameters."""
    
    # AM broadcasting parameters (typical values)
    broadcast_params = {
        'carrier_freq': 1000000,  # 1 MHz carrier
        'audio_freq': 1000,       # 1 kHz audio tone
        'modulation_index': 0.8,  # 80% modulation
        'sampling_rate': 10000000 # 10 MHz sampling for high fidelity
    }
    
    # Create high-fidelity analyzer
    broadcast_analyzer = AdvancedAMAnalyzer(
        sampling_rate=broadcast_params['sampling_rate'], 
        duration=0.01  # 10ms for detailed analysis
    )
    
    # Generate broadcast signal
    am_signal, carrier, audio = broadcast_analyzer.generate_am_signal(
        broadcast_params['carrier_freq'],
        broadcast_params['audio_freq'],
        broadcast_params['modulation_index']
    )
    
    # Analyze signal quality
    quality_metrics = broadcast_analyzer.calculate_signal_quality_metrics(am_signal, audio)
    
    # Create comprehensive broadcast analysis
    fig = plt.figure(figsize=(16, 12))
    gs = gridspec.GridSpec(3, 3, figure=fig)
    
    # Time domain - full signal
    ax1 = fig.add_subplot(gs[0, :])
    ax1.plot(broadcast_analyzer.time, am_signal, 'b-', linewidth=0.5)
    ax1.set_title('AM Broadcast Signal - Time Domain')
    ax1.set_xlabel('Time (s)')
    ax1.set_ylabel('Amplitude')
    ax1.grid(True)
    
    # Time domain - zoomed
    ax2 = fig.add_subplot(gs[1, 0])
    zoom_samples = int(0.001 * broadcast_params['sampling_rate'])  # 1ms
    ax2.plot(broadcast_analyzer.time[:zoom_samples], am_signal[:zoom_samples], 'r-')
    ax2.set_title('Zoomed View (1ms)')
    ax2.set_xlabel('Time (s)')
    ax2.set_ylabel('Amplitude')
    ax2.grid(True)
    
    # Frequency domain
    ax3 = fig.add_subplot(gs[1, 1])
    analysis = broadcast_analyzer.analyze_sidebands(am_signal, 
                                                   broadcast_params['carrier_freq'],
                                                   broadcast_params['audio_freq'])
    freqs = analysis['frequencies']
    fft_signal = analysis['fft_signal']
    
    # Plot around carrier frequency
    carrier_range = (freqs >= broadcast_params['carrier_freq'] - 5000) & \
                   (freqs <= broadcast_params['carrier_freq'] + 5000)
    ax3.plot(freqs[carrier_range], np.abs(fft_signal[carrier_range]), 'g-')
    ax3.set_title('Frequency Domain (Carrier ±5kHz)')
    ax3.set_xlabel('Frequency (Hz)')
    ax3.set_ylabel('Magnitude')
    ax3.grid(True)
    
    # Signal quality metrics
    ax4 = fig.add_subplot(gs[1, 2])
    metrics = ['SNR (dB)', 'Distortion', 'Signal Power', 'Noise Power']
    values = [quality_metrics['snr_db'], quality_metrics['distortion'],
              quality_metrics['signal_power'], quality_metrics['noise_power']]
    
    bars = ax4.bar(metrics, values, color=['blue', 'red', 'green', 'orange'])
    ax4.set_title('Signal Quality Metrics')
    ax4.set_ylabel('Value')
    ax4.tick_params(axis='x', rotation=45)
    
    # Add value labels on bars
    for bar, value in zip(bars, values):
        height = bar.get_height()
        ax4.text(bar.get_x() + bar.get_width()/2., height,
                f'{value:.2f}', ha='center', va='bottom')
    
    # Power distribution pie chart
    ax5 = fig.add_subplot(gs[2, 0])
    powers = [analysis['carrier_power'], 
              analysis['upper_sideband_power'], 
              analysis['lower_sideband_power']]
    labels = ['Carrier', 'Upper Sideband', 'Lower Sideband']
    colors = ['lightblue', 'lightgreen', 'lightcoral']
    
    ax5.pie(powers, labels=labels, colors=colors, autopct='%1.1f%%', startangle=90)
    ax5.set_title('Power Distribution')
    
    # Modulation depth analysis
    ax6 = fig.add_subplot(gs[2, 1])
    calculated_mi, envelope = broadcast_analyzer.calculate_modulation_index(am_signal, carrier)
    
    ax6.plot(broadcast_analyzer.time[:zoom_samples], am_signal[:zoom_samples], 'b-', alpha=0.7)
    ax6.plot(broadcast_analyzer.time[:zoom_samples], envelope[:zoom_samples], 'r--', linewidth=2)
    ax6.fill_between(broadcast_analyzer.time[:zoom_samples], 
                     envelope[:zoom_samples], -envelope[:zoom_samples], 
                     alpha=0.2, color='red')
    ax6.set_title(f'Modulation Depth Analysis\nCalculated MI: {calculated_mi:.3f}')
    ax6.set_xlabel('Time (s)')
    ax6.set_ylabel('Amplitude')
    ax6.grid(True)
    
    # Bandwidth analysis
    ax7 = fig.add_subplot(gs[2, 2])
    bandwidth = 2 * broadcast_params['audio_freq']  # AM bandwidth = 2 * message frequency
    ax7.axvspan(broadcast_params['carrier_freq'] - bandwidth/2, 
                broadcast_params['carrier_freq'] + bandwidth/2, 
                alpha=0.3, color='yellow', label=f'Bandwidth: {bandwidth} Hz')
    ax7.plot(freqs[carrier_range], np.abs(fft_signal[carrier_range]), 'b-')
    ax7.set_title('Bandwidth Analysis')
    ax7.set_xlabel('Frequency (Hz)')
    ax7.set_ylabel('Magnitude')
    ax7.legend()
    ax7.grid(True)
    
    plt.tight_layout()
    plt.show()
    
    # Print analysis summary
    print("=== AM Broadcasting Signal Analysis ===")
    print(f"Carrier Frequency: {broadcast_params['carrier_freq']/1000:.1f} kHz")
    print(f"Audio Frequency: {broadcast_params['audio_freq']} Hz")
    print(f"Modulation Index: {broadcast_params['modulation_index']}")
    print(f"Calculated Modulation Index: {calculated_mi:.3f}")
    print(f"Signal-to-Noise Ratio: {quality_metrics['snr_db']:.2f} dB")
    print(f"Signal Distortion: {quality_metrics['distortion']:.3f}")
    print(f"Bandwidth: {bandwidth} Hz")
    print(f"Carrier Power: {analysis['carrier_power']:.2e}")
    print(f"Sideband Power: {analysis['upper_sideband_power'] + analysis['lower_sideband_power']:.2e}")

# Run broadcasting analysis
am_broadcasting_analysis()
```

## Advanced Signal Processing Techniques

### Noise Analysis and Filtering

```python
def noise_analysis_and_filtering():
    """Analyze AM signal behavior under different noise conditions and apply filtering."""
    
    # Generate clean AM signal
    clean_signal, carrier, message = analyzer.generate_am_signal(
        carrier_freq=1000, message_freq=100, modulation_index=0.8
    )
    
    # Add different types of noise
    noise_levels = [0.0, 0.1, 0.3, 0.5]
    noise_types = ['Gaussian', 'Impulse', 'Sinusoidal']
    
    fig, axes = plt.subplots(len(noise_levels), len(noise_types) + 1, figsize=(20, 12))
    fig.suptitle('AM Signal Analysis Under Different Noise Conditions', fontsize=16)
    
    for i, noise_level in enumerate(noise_levels):
        # Clean signal (first column)
        axes[i, 0].plot(analyzer.time[:500], clean_signal[:500], 'b-')
        axes[i, 0].set_title(f'Clean Signal (Noise: {noise_level})')
        axes[i, 0].set_ylabel('Amplitude')
        axes[i, 0].grid(True)
        
        # Different noise types
        for j, noise_type in enumerate(noise_types):
            if noise_level == 0:
                noisy_signal = clean_signal
            else:
                if noise_type == 'Gaussian':
                    noise = noise_level * np.random.normal(0, 1, len(clean_signal))
                elif noise_type == 'Impulse':
                    noise = noise_level * np.random.laplace(0, 1, len(clean_signal))
                else:  # Sinusoidal
                    noise = noise_level * np.sin(2 * np.pi * 500 * analyzer.time)
                
                noisy_signal = clean_signal + noise
            
            # Apply simple low-pass filter
            if noise_level > 0:
                # Design Butterworth low-pass filter
                cutoff_freq = 200  # Hz
                nyquist = analyzer.sampling_rate / 2
                normal_cutoff = cutoff_freq / nyquist
                b, a = signal.butter(4, normal_cutoff, btype='low')
                filtered_signal = signal.filtfilt(b, a, noisy_signal)
            else:
                filtered_signal = noisy_signal
            
            # Plot noisy and filtered signals
            axes[i, j+1].plot(analyzer.time[:500], noisy_signal[:500], 'r-', alpha=0.7, label='Noisy')
            axes[i, j+1].plot(analyzer.time[:500], filtered_signal[:500], 'g-', label='Filtered')
            axes[i, j+1].set_title(f'{noise_type} Noise (Level: {noise_level})')
            axes[i, j+1].legend()
            axes[i, j+1].grid(True)
    
    plt.tight_layout()
    plt.show()
    
    # Calculate and display noise impact metrics
    print("\n=== Noise Impact Analysis ===")
    for noise_level in noise_levels[1:]:  # Skip clean signal
        for noise_type in noise_types:
            if noise_type == 'Gaussian':
                noise = noise_level * np.random.normal(0, 1, len(clean_signal))
            elif noise_type == 'Impulse':
                noise = noise_level * np.random.laplace(0, 1, len(clean_signal))
            else:
                noise = noise_level * np.sin(2 * np.pi * 500 * analyzer.time)
            
            noisy_signal = clean_signal + noise
            
            # Calculate metrics
            snr = 10 * np.log10(np.var(clean_signal) / np.var(noise))
            correlation = np.corrcoef(clean_signal, noisy_signal)[0, 1]
            
            print(f"{noise_type} Noise (Level {noise_level}): SNR = {snr:.2f} dB, Correlation = {correlation:.3f}")

# Run noise analysis
noise_analysis_and_filtering()
```

## Practical Implementation: AM Signal Quality Monitor

```python
class AMSignalQualityMonitor:
    """Real-time AM signal quality monitoring system."""
    
    def __init__(self, target_carrier_freq, target_message_freq):
        self.target_carrier_freq = target_carrier_freq
        self.target_message_freq = target_message_freq
        self.analyzer = AdvancedAMAnalyzer()
        
    def monitor_signal_quality(self, am_signal, carrier_signal, message_signal):
        """Monitor various quality metrics of AM signal."""
        
        # Calculate modulation index
        mi, envelope = self.analyzer.calculate_modulation_index(am_signal, carrier_signal)
        
        # Analyze sidebands
        sideband_analysis = self.analyzer.analyze_sidebands(
            am_signal, self.target_carrier_freq, self.target_message_freq
        )
        
        # Calculate quality metrics
        quality_metrics = self.analyzer.calculate_signal_quality_metrics(am_signal, message_signal)
        
        # Create quality report
        report = {
            'modulation_index': mi,
            'modulation_depth_percent': mi * 100,
            'carrier_power': sideband_analysis['carrier_power'],
            'sideband_power': sideband_analysis['upper_sideband_power'] + sideband_analysis['lower_sideband_power'],
            'total_power': sideband_analysis['total_power'],
            'power_efficiency': (sideband_analysis['upper_sideband_power'] + sideband_analysis['lower_sideband_power']) / sideband_analysis['total_power'] * 100,
            'snr_db': quality_metrics['snr_db'],
            'distortion': quality_metrics['distortion'],
            'signal_quality_score': self._calculate_quality_score(mi, quality_metrics['snr_db'], quality_metrics['distortion'])
        }
        
        return report, envelope
    
    def _calculate_quality_score(self, mi, snr_db, distortion):
        """Calculate overall signal quality score (0-100)."""
        # Optimal modulation index is 1.0
        mi_score = max(0, 100 - abs(mi - 1.0) * 50)
        
        # SNR score (higher is better)
        snr_score = min(100, max(0, snr_db + 20))  # Assume -20dB is minimum acceptable
        
        # Distortion score (lower is better)
        distortion_score = max(0, 100 - distortion * 100)
        
        # Weighted average
        overall_score = (mi_score * 0.3 + snr_score * 0.4 + distortion_score * 0.3)
        return overall_score
    
    def generate_quality_report(self, am_signal, carrier_signal, message_signal):
        """Generate comprehensive quality report with visualization."""
        
        report, envelope = self.monitor_signal_quality(am_signal, carrier_signal, message_signal)
        
        # Create comprehensive report visualization
        fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(15, 12))
        fig.suptitle('AM Signal Quality Monitor Report', fontsize=16)
        
        # Time domain with envelope
        ax1.plot(self.analyzer.time[:1000], am_signal[:1000], 'b-', alpha=0.7, label='AM Signal')
        ax1.plot(self.analyzer.time[:1000], envelope[:1000], 'r--', linewidth=2, label='Envelope')
        ax1.fill_between(self.analyzer.time[:1000], envelope[:1000], -envelope[:1000], alpha=0.1, color='red')
        ax1.set_title('Time Domain Analysis')
        ax1.set_xlabel('Time (s)')
        ax1.set_ylabel('Amplitude')
        ax1.legend()
        ax1.grid(True)
        
        # Quality metrics radar chart
        ax2 = fig.add_subplot(2, 2, 2, projection='polar')
        categories = ['Modulation\nIndex', 'SNR', 'Power\nEfficiency', 'Signal\nQuality']
        values = [report['modulation_depth_percent'], 
                 min(100, report['snr_db'] + 20),
                 report['power_efficiency'],
                 report['signal_quality_score']]
        
        angles = np.linspace(0, 2 * np.pi, len(categories), endpoint=False).tolist()
        values += values[:1]  # Complete the circle
        angles += angles[:1]
        
        ax2.plot(angles, values, 'o-', linewidth=2, color='blue')
        ax2.fill(angles, values, alpha=0.25, color='blue')
        ax2.set_xticks(angles[:-1])
        ax2.set_xticklabels(categories)
        ax2.set_ylim(0, 100)
        ax2.set_title('Quality Metrics Radar Chart')
        
        # Power distribution
        ax3.bar(['Carrier', 'Sidebands', 'Total'], 
                [report['carrier_power'], report['sideband_power'], report['total_power']],
                color=['lightblue', 'lightgreen', 'lightcoral'])
        ax3.set_title('Power Distribution')
        ax3.set_ylabel('Power')
        ax3.grid(True, axis='y')
        
        # Quality score gauge
        ax4 = fig.add_subplot(2, 2, 4, projection='polar')
        score_angle = (report['signal_quality_score'] / 100) * np.pi
        ax4.bar(0, 1, width=score_angle, color='green', alpha=0.7)
        ax4.bar(0, 1, width=2*np.pi-score_angle, color='red', alpha=0.3)
        ax4.set_title(f'Overall Quality Score: {report["signal_quality_score"]:.1f}/100')
        ax4.set_xticks([])
        ax4.set_yticks([])
        
        plt.tight_layout()
        plt.show()
        
        # Print detailed report
        print("\n" + "="*50)
        print("AM SIGNAL QUALITY MONITOR REPORT")
        print("="*50)
        print(f"Modulation Index: {report['modulation_index']:.3f} ({report['modulation_depth_percent']:.1f}%)")
        print(f"Signal-to-Noise Ratio: {report['snr_db']:.2f} dB")
        print(f"Signal Distortion: {report['distortion']:.3f}")
        print(f"Power Efficiency: {report['power_efficiency']:.1f}%")
        print(f"Overall Quality Score: {report['signal_quality_score']:.1f}/100")
        print(f"Carrier Power: {report['carrier_power']:.2e}")
        print(f"Sideband Power: {report['sideband_power']:.2e}")
        print(f"Total Power: {report['total_power']:.2e}")
        
        # Quality assessment
        if report['signal_quality_score'] >= 80:
            assessment = "EXCELLENT"
        elif report['signal_quality_score'] >= 60:
            assessment = "GOOD"
        elif report['signal_quality_score'] >= 40:
            assessment = "FAIR"
        else:
            assessment = "POOR"
        
        print(f"\nQuality Assessment: {assessment}")
        print("="*50)

# Example usage of the quality monitor
def demonstrate_quality_monitor():
    """Demonstrate the AM signal quality monitoring system."""
    
    # Generate test signals
    test_analyzer = AdvancedAMAnalyzer()
    am_signal, carrier, message = test_analyzer.generate_am_signal(
        carrier_freq=1000, message_freq=100, modulation_index=0.85
    )
    
    # Create and run quality monitor
    monitor = AMSignalQualityMonitor(target_carrier_freq=1000, target_message_freq=100)
    monitor.generate_quality_report(am_signal, carrier, message)

# Run quality monitor demonstration
demonstrate_quality_monitor()
```

## Conclusion

This advanced AM modulation analysis guide builds upon the foundational concepts from our original post, providing you with sophisticated tools and techniques for real-world signal processing applications. The comprehensive analysis framework, real-world case studies, and practical implementation examples demonstrate how to move beyond basic AM generation to professional-grade signal analysis.

Key takeaways from this advanced guide include:

1. **Modulation Index Analysis**: Understanding and calculating modulation depth for optimal signal quality
2. **Sideband Analysis**: Examining power distribution and efficiency in carrier and sideband components
3. **Frequency Domain Visualization**: Advanced spectral analysis using FFT techniques
4. **Signal Quality Metrics**: Comprehensive quality assessment including SNR, distortion, and efficiency
5. **Real-World Applications**: Practical implementation for broadcasting and communication systems
6. **Noise Analysis**: Understanding signal behavior under different noise conditions
7. **Quality Monitoring**: Building automated systems for signal quality assessment

These advanced techniques are essential for professionals working in radio communication, broadcasting, signal processing, and related fields where precise AM signal analysis is critical for system performance and compliance.

For further exploration, consider applying these techniques to other modulation schemes (FM, PM) or extending the analysis to include digital modulation techniques. The mathematical foundations and visualization approaches developed here provide a solid foundation for more complex signal processing applications.
