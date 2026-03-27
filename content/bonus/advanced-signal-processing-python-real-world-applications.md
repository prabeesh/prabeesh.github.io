---
title: "Advanced Signal Processing and Analysis with Python: From Theory to Real-World Applications"
date: 2023-10-14T14:20:00+01:00
draft: false
tags: [Python, signal processing, data analysis, digital filters, FFT, matplotlib, scientific computing, audio processing, biomedical signals]
keywords: Python signal processing, digital signal processing Python, FFT analysis Python, Python audio processing, biomedical signal analysis, Python matplotlib signal visualization, scientific Python signal processing
description: Master advanced signal processing techniques in Python for real-world applications. Learn digital filtering, FFT analysis, spectral processing, and visualization techniques for audio, biomedical, and sensor data analysis.
---

Building upon our foundation in [AM wave generation and plotting](/blog/2011/09/25/am-plot-matplotlib/), this advanced guide explores sophisticated signal processing techniques using Python for professional applications in audio processing, biomedical signal analysis, and sensor data processing.

## Advanced Signal Processing Framework

```python
import numpy as np
import matplotlib.pyplot as plt
from scipy import signal, fft
from scipy.io import wavfile
import pandas as pd
from typing import Tuple, Optional, Dict, List
import warnings
warnings.filterwarnings('ignore')

class AdvancedSignalProcessor:
    """Comprehensive signal processing toolkit for real-world applications"""
    
    def __init__(self, sampling_rate: float = 44100):
        self.fs = sampling_rate
        self.nyquist = sampling_rate / 2
        
        # Filter bank storage
        self.filter_bank = {}
        
        # Processing history for analysis
        self.processing_history = []
    
    def design_filter(self, filter_type: str, cutoff: float, 
                     order: int = 5, filter_name: str = 'default') -> Tuple[np.ndarray, np.ndarray]:
        """Design digital filters with various types and characteristics"""
        
        # Normalize cutoff frequency
        normalized_cutoff = cutoff / self.nyquist
        
        if filter_type.lower() == 'butterworth_lowpass':
            b, a = signal.butter(order, normalized_cutoff, btype='low')
        elif filter_type.lower() == 'butterworth_highpass':
            b, a = signal.butter(order, normalized_cutoff, btype='high')
        elif filter_type.lower() == 'butterworth_bandpass':
            # Cutoff should be [low, high]
            if isinstance(cutoff, (list, tuple)) and len(cutoff) == 2:
                normalized_cutoff = [f / self.nyquist for f in cutoff]
                b, a = signal.butter(order, normalized_cutoff, btype='band')
            else:
                raise ValueError("Bandpass filter requires [low_cutoff, high_cutoff]")
        elif filter_type.lower() == 'chebyshev_lowpass':
            b, a = signal.cheby1(order, 1, normalized_cutoff, btype='low')
        elif filter_type.lower() == 'elliptic_lowpass':
            b, a = signal.ellip(order, 1, 40, normalized_cutoff, btype='low')
        elif filter_type.lower() == 'bessel_lowpass':
            b, a = signal.bessel(order, normalized_cutoff, btype='low')
        else:
            raise ValueError(f"Unknown filter type: {filter_type}")
        
        # Store filter coefficients
        self.filter_bank[filter_name] = {'b': b, 'a': a, 'type': filter_type}
        
        return b, a
    
    def apply_filter(self, data: np.ndarray, filter_name: str = 'default', 
                    method: str = 'filtfilt') -> np.ndarray:
        """Apply designed filter to signal data"""
        
        if filter_name not in self.filter_bank:
            raise ValueError(f"Filter '{filter_name}' not found in filter bank")
        
        b = self.filter_bank[filter_name]['b']
        a = self.filter_bank[filter_name]['a']
        
        if method == 'filtfilt':
            # Zero-phase filtering (forward-backward)
            filtered_data = signal.filtfilt(b, a, data)
        elif method == 'lfilter':
            # Standard causal filtering
            filtered_data = signal.lfilter(b, a, data)
        else:
            raise ValueError("Method must be 'filtfilt' or 'lfilter'")
        
        # Log processing step
        self.processing_history.append({
            'operation': 'filter',
            'filter_name': filter_name,
            'method': method,
            'input_shape': data.shape,
            'output_shape': filtered_data.shape
        })
        
        return filtered_data
    
    def adaptive_filter(self, input_signal: np.ndarray, desired_signal: np.ndarray,
                       filter_length: int = 32, mu: float = 0.01) -> Tuple[np.ndarray, np.ndarray]:
        """Implement adaptive LMS (Least Mean Squares) filter"""
        
        N = len(input_signal)
        
        # Initialize filter weights and output
        weights = np.zeros(filter_length)
        output = np.zeros(N)
        error = np.zeros(N)
        
        # Create input buffer
        input_buffer = np.zeros(filter_length)
        
        for n in range(N):
            # Update input buffer (shift register)
            input_buffer[1:] = input_buffer[:-1]
            input_buffer[0] = input_signal[n]
            
            # Calculate filter output
            output[n] = np.dot(weights, input_buffer)
            
            # Calculate error
            error[n] = desired_signal[n] - output[n]
            
            # Update weights using LMS algorithm
            weights += 2 * mu * error[n] * input_buffer
        
        return output, error
    
    def spectral_analysis(self, data: np.ndarray, window: str = 'hann',
                         nperseg: Optional[int] = None) -> Dict:
        """Comprehensive spectral analysis of signal"""
        
        # Time-domain statistics
        time_stats = {
            'mean': np.mean(data),
            'std': np.std(data),
            'rms': np.sqrt(np.mean(data**2)),
            'peak': np.max(np.abs(data)),
            'crest_factor': np.max(np.abs(data)) / np.sqrt(np.mean(data**2))
        }
        
        # FFT Analysis
        N = len(data)
        freqs = np.fft.fftfreq(N, 1/self.fs)
        fft_data = np.fft.fft(data)
        magnitude = np.abs(fft_data)
        phase = np.angle(fft_data)
        
        # Power Spectral Density using Welch's method
        if nperseg is None:
            nperseg = min(N // 8, 1024)
        
        f_psd, psd = signal.welch(data, fs=self.fs, window=window, nperseg=nperseg)
        
        # Spectrogram
        f_spec, t_spec, spectrogram = signal.spectrogram(data, fs=self.fs, 
                                                        window=window, nperseg=nperseg)
        
        # Spectral features
        spectral_stats = {
            'dominant_frequency': freqs[np.argmax(magnitude[:N//2])],
            'spectral_centroid': np.sum(freqs[:N//2] * magnitude[:N//2]) / np.sum(magnitude[:N//2]),
            'spectral_bandwidth': np.sqrt(np.sum(((freqs[:N//2] - 
                np.sum(freqs[:N//2] * magnitude[:N//2]) / np.sum(magnitude[:N//2]))**2) * 
                magnitude[:N//2]) / np.sum(magnitude[:N//2])),
            'spectral_rolloff': self._calculate_spectral_rolloff(freqs[:N//2], magnitude[:N//2]),
            'zero_crossing_rate': self._calculate_zero_crossings(data)
        }
        
        return {
            'time_stats': time_stats,
            'spectral_stats': spectral_stats,
            'frequencies': freqs[:N//2],
            'magnitude': magnitude[:N//2],
            'phase': phase[:N//2],
            'psd_frequencies': f_psd,
            'psd': psd,
            'spectrogram_frequencies': f_spec,
            'spectrogram_times': t_spec,
            'spectrogram': spectrogram
        }
    
    def _calculate_spectral_rolloff(self, freqs: np.ndarray, magnitude: np.ndarray, 
                                  threshold: float = 0.85) -> float:
        """Calculate spectral rolloff frequency"""
        total_energy = np.sum(magnitude)
        cumulative_energy = np.cumsum(magnitude)
        rolloff_index = np.where(cumulative_energy >= threshold * total_energy)[0]
        
        if len(rolloff_index) > 0:
            return freqs[rolloff_index[0]]
        else:
            return freqs[-1]
    
    def _calculate_zero_crossings(self, data: np.ndarray) -> float:
        """Calculate zero crossing rate"""
        zero_crossings = np.sum(np.diff(np.sign(data)) != 0)
        return zero_crossings / len(data)
    
    def envelope_detection(self, data: np.ndarray, method: str = 'hilbert') -> np.ndarray:
        """Extract signal envelope using various methods"""
        
        if method == 'hilbert':
            # Hilbert transform for analytical signal
            analytic_signal = signal.hilbert(data)
            envelope = np.abs(analytic_signal)
        
        elif method == 'peak':
            # Peak envelope detection
            peaks, _ = signal.find_peaks(np.abs(data))
            envelope = np.interp(np.arange(len(data)), peaks, np.abs(data[peaks]))
        
        elif method == 'moving_average':
            # Moving average of absolute values
            window_size = int(0.01 * self.fs)  # 10ms window
            envelope = np.convolve(np.abs(data), 
                                 np.ones(window_size)/window_size, mode='same')
        
        else:
            raise ValueError("Method must be 'hilbert', 'peak', or 'moving_average'")
        
        return envelope
    
    def cross_correlation_analysis(self, signal1: np.ndarray, signal2: np.ndarray) -> Dict:
        """Perform cross-correlation analysis between two signals"""
        
        # Normalize signals
        signal1_norm = (signal1 - np.mean(signal1)) / np.std(signal1)
        signal2_norm = (signal2 - np.mean(signal2)) / np.std(signal2)
        
        # Cross-correlation
        correlation = signal.correlate(signal1_norm, signal2_norm, mode='full')
        lags = signal.correlation_lags(len(signal1_norm), len(signal2_norm), mode='full')
        
        # Find peak correlation and corresponding lag
        max_corr_idx = np.argmax(np.abs(correlation))
        max_correlation = correlation[max_corr_idx]
        optimal_lag = lags[max_corr_idx]
        
        # Time delay in seconds
        time_delay = optimal_lag / self.fs
        
        return {
            'correlation': correlation,
            'lags': lags,
            'max_correlation': max_correlation,
            'optimal_lag': optimal_lag,
            'time_delay_seconds': time_delay,
            'lag_times': lags / self.fs
        }

# Biomedical Signal Processing Specialization
class BiomedicalSignalProcessor(AdvancedSignalProcessor):
    """Specialized signal processor for biomedical applications"""
    
    def __init__(self, sampling_rate: float = 1000):  # Typical for bio signals
        super().__init__(sampling_rate)
        
        # Biomedical signal frequency bands
        self.frequency_bands = {
            'eeg_delta': (0.5, 4),
            'eeg_theta': (4, 8),
            'eeg_alpha': (8, 13),
            'eeg_beta': (13, 30),
            'eeg_gamma': (30, 100),
            'ecg_baseline': (0.05, 0.5),
            'ecg_main': (0.5, 40),
            'emg_low': (10, 100),
            'emg_high': (100, 500)
        }
    
    def ecg_preprocessing(self, ecg_data: np.ndarray) -> Dict:
        """Comprehensive ECG signal preprocessing"""
        
        # Remove baseline wander (high-pass filter)
        self.design_filter('butterworth_highpass', 0.5, order=4, filter_name='baseline_removal')
        ecg_detrended = self.apply_filter(ecg_data, 'baseline_removal')
        
        # Remove power line interference (notch filter)
        # Design notch filter at 50Hz or 60Hz
        notch_freq = 50  # Change to 60 for US
        Q = 30  # Quality factor
        b_notch, a_notch = signal.iirnotch(notch_freq, Q, self.fs)
        ecg_clean = signal.filtfilt(b_notch, a_notch, ecg_detrended)
        
        # Low-pass filter to remove high-frequency noise
        self.design_filter('butterworth_lowpass', 40, order=4, filter_name='noise_removal')
        ecg_filtered = self.apply_filter(ecg_clean, 'noise_removal')
        
        return {
            'original': ecg_data,
            'detrended': ecg_detrended,
            'notch_filtered': ecg_clean,
            'final_filtered': ecg_filtered
        }
    
    def detect_qrs_complexes(self, ecg_data: np.ndarray) -> Dict:
        """QRS complex detection using Pan-Tompkins algorithm"""
        
        # Preprocessing
        ecg_processed = self.ecg_preprocessing(ecg_data)['final_filtered']
        
        # Derivative filter
        derivative = np.diff(ecg_processed)
        
        # Squaring
        squared = derivative ** 2
        
        # Moving average integration
        window_size = int(0.08 * self.fs)  # 80ms window
        integrated = np.convolve(squared, np.ones(window_size), mode='same')
        
        # Peak detection with adaptive threshold
        peaks, properties = signal.find_peaks(integrated, 
                                            height=np.max(integrated) * 0.3,
                                            distance=int(0.2 * self.fs))  # 200ms refractory
        
        # Calculate heart rate
        if len(peaks) > 1:
            rr_intervals = np.diff(peaks) / self.fs  # in seconds
            heart_rate = 60 / np.mean(rr_intervals)  # BPM
            heart_rate_variability = np.std(rr_intervals) * 1000  # in ms
        else:
            heart_rate = 0
            heart_rate_variability = 0
        
        return {
            'qrs_peaks': peaks,
            'rr_intervals': rr_intervals if len(peaks) > 1 else np.array([]),
            'heart_rate_bpm': heart_rate,
            'hrv_ms': heart_rate_variability,
            'processed_signal': integrated
        }
    
    def eeg_band_power_analysis(self, eeg_data: np.ndarray) -> Dict:
        """Analyze power in different EEG frequency bands"""
        
        band_powers = {}
        
        for band_name, (low_freq, high_freq) in self.frequency_bands.items():
            if not band_name.startswith('eeg_'):
                continue
            
            # Design bandpass filter for this frequency band
            self.design_filter('butterworth_bandpass', [low_freq, high_freq], 
                             order=4, filter_name=f'{band_name}_filter')
            
            # Filter EEG data
            filtered_eeg = self.apply_filter(eeg_data, f'{band_name}_filter')
            
            # Calculate band power
            band_power = np.mean(filtered_eeg ** 2)
            
            band_powers[band_name.replace('eeg_', '')] = {
                'power': band_power,
                'relative_power': 0,  # Will be calculated after all bands
                'filtered_signal': filtered_eeg
            }
        
        # Calculate relative power
        total_power = sum([bp['power'] for bp in band_powers.values()])
        for band in band_powers:
            band_powers[band]['relative_power'] = band_powers[band]['power'] / total_power
        
        return band_powers

# Audio Signal Processing Specialization
class AudioSignalProcessor(AdvancedSignalProcessor):
    """Specialized signal processor for audio applications"""
    
    def __init__(self, sampling_rate: float = 44100):
        super().__init__(sampling_rate)
    
    def load_audio_file(self, filepath: str) -> Tuple[np.ndarray, int]:
        """Load audio file and return signal data"""
        try:
            sample_rate, audio_data = wavfile.read(filepath)
            
            # Convert to float and normalize
            if audio_data.dtype == np.int16:
                audio_data = audio_data.astype(np.float32) / 32768.0
            elif audio_data.dtype == np.int32:
                audio_data = audio_data.astype(np.float32) / 2147483648.0
            
            # Handle stereo to mono conversion
            if len(audio_data.shape) > 1:
                audio_data = np.mean(audio_data, axis=1)
            
            self.fs = sample_rate
            return audio_data, sample_rate
            
        except Exception as e:
            raise ValueError(f"Could not load audio file: {e}")
    
    def extract_audio_features(self, audio_data: np.ndarray, 
                             frame_size: int = 1024, hop_size: int = 512) -> Dict:
        """Extract comprehensive audio features"""
        
        features = {}
        
        # Spectral analysis
        spectral_data = self.spectral_analysis(audio_data)
        
        # MFCCs (Mel-frequency cepstral coefficients)
        mfccs = self._calculate_mfccs(audio_data, frame_size)
        features['mfccs'] = mfccs
        
        # Tempo and beat tracking
        tempo, beats = self._estimate_tempo(audio_data)
        features['tempo'] = tempo
        features['beats'] = beats
        
        # Pitch estimation
        pitch = self._estimate_pitch(audio_data)
        features['pitch'] = pitch
        
        # Spectral features
        features.update({
            'spectral_centroid': spectral_data['spectral_stats']['spectral_centroid'],
            'spectral_bandwidth': spectral_data['spectral_stats']['spectral_bandwidth'],
            'spectral_rolloff': spectral_data['spectral_stats']['spectral_rolloff'],
            'zero_crossing_rate': spectral_data['spectral_stats']['zero_crossing_rate'],
            'rms_energy': spectral_data['time_stats']['rms']
        })
        
        return features
    
    def _calculate_mfccs(self, audio_data: np.ndarray, frame_size: int = 1024) -> np.ndarray:
        """Calculate Mel-frequency cepstral coefficients"""
        
        # This is a simplified implementation
        # In practice, you would use librosa or similar library
        
        # Pre-emphasis
        pre_emphasis = 0.97
        emphasized_signal = np.append(audio_data[0], 
                                    audio_data[1:] - pre_emphasis * audio_data[:-1])
        
        # Windowing
        frame_count = len(emphasized_signal) // frame_size
        frames = emphasized_signal[:frame_count * frame_size].reshape(frame_count, frame_size)
        
        # Apply Hamming window
        hamming_window = np.hamming(frame_size)
        windowed_frames = frames * hamming_window
        
        # FFT and Power Spectrum
        fft_frames = np.fft.fft(windowed_frames, axis=1)
        power_spectrum = np.abs(fft_frames) ** 2
        
        # Mel Filter Bank (simplified - would need proper mel scale implementation)
        # Return first 13 coefficients as placeholder
        return power_spectrum[:, :13]
    
    def _estimate_tempo(self, audio_data: np.ndarray) -> Tuple[float, np.ndarray]:
        """Simple tempo estimation"""
        
        # Calculate onset strength
        hop_length = 512
        frame_length = 2048
        
        # Simple energy-based onset detection
        energy = []
        for i in range(0, len(audio_data) - frame_length, hop_length):
            frame = audio_data[i:i + frame_length]
            energy.append(np.sum(frame ** 2))
        
        energy = np.array(energy)
        
        # Simple peak-based beat detection
        peaks, _ = signal.find_peaks(energy, distance=int(self.fs / hop_length * 0.1))
        
        if len(peaks) > 1:
            tempo = 60 * self.fs / hop_length / np.mean(np.diff(peaks))
        else:
            tempo = 120  # Default
        
        return tempo, peaks
    
    def _estimate_pitch(self, audio_data: np.ndarray) -> np.ndarray:
        """Simple pitch estimation using autocorrelation"""
        
        # Autocorrelation-based pitch detection
        autocorr = signal.correlate(audio_data, audio_data, mode='full')
        autocorr = autocorr[autocorr.size // 2:]
        
        # Find peaks in autocorrelation
        min_pitch_samples = int(self.fs / 500)  # 500 Hz max
        max_pitch_samples = int(self.fs / 50)   # 50 Hz min
        
        search_range = autocorr[min_pitch_samples:max_pitch_samples]
        if len(search_range) > 0:
            pitch_sample = np.argmax(search_range) + min_pitch_samples
            pitch_hz = self.fs / pitch_sample
        else:
            pitch_hz = 0
        
        return pitch_hz

# Visualization utilities
class SignalVisualizer:
    """Advanced signal visualization toolkit"""
    
    @staticmethod
    def plot_signal_analysis(data: np.ndarray, analysis_results: Dict, 
                           sampling_rate: float, title: str = "Signal Analysis"):
        """Create comprehensive signal analysis plots"""
        
        fig, axes = plt.subplots(3, 2, figsize=(15, 12))
        fig.suptitle(title, fontsize=16)
        
        # Time domain plot
        t = np.arange(len(data)) / sampling_rate
        axes[0, 0].plot(t, data)
        axes[0, 0].set_title('Time Domain Signal')
        axes[0, 0].set_xlabel('Time (s)')
        axes[0, 0].set_ylabel('Amplitude')
        axes[0, 0].grid(True)
        
        # Frequency domain plot
        axes[0, 1].plot(analysis_results['frequencies'], 
                       20 * np.log10(analysis_results['magnitude'] + 1e-10))
        axes[0, 1].set_title('Frequency Domain (dB)')
        axes[0, 1].set_xlabel('Frequency (Hz)')
        axes[0, 1].set_ylabel('Magnitude (dB)')
        axes[0, 1].grid(True)
        
        # Power Spectral Density
        axes[1, 0].semilogy(analysis_results['psd_frequencies'], analysis_results['psd'])
        axes[1, 0].set_title('Power Spectral Density')
        axes[1, 0].set_xlabel('Frequency (Hz)')
        axes[1, 0].set_ylabel('PSD')
        axes[1, 0].grid(True)
        
        # Spectrogram
        im = axes[1, 1].imshow(10 * np.log10(analysis_results['spectrogram'] + 1e-10),
                               aspect='auto', origin='lower', 
                               extent=[analysis_results['spectrogram_times'][0],
                                      analysis_results['spectrogram_times'][-1],
                                      analysis_results['spectrogram_frequencies'][0],
                                      analysis_results['spectrogram_frequencies'][-1]])
        axes[1, 1].set_title('Spectrogram (dB)')
        axes[1, 1].set_xlabel('Time (s)')
        axes[1, 1].set_ylabel('Frequency (Hz)')
        plt.colorbar(im, ax=axes[1, 1])
        
        # Phase plot
        axes[2, 0].plot(analysis_results['frequencies'], 
                       np.unwrap(analysis_results['phase']))
        axes[2, 0].set_title('Phase Spectrum')
        axes[2, 0].set_xlabel('Frequency (Hz)')
        axes[2, 0].set_ylabel('Phase (rad)')
        axes[2, 0].grid(True)
        
        # Signal statistics
        stats_text = f"""
        Mean: {analysis_results['time_stats']['mean']:.4f}
        Std: {analysis_results['time_stats']['std']:.4f}
        RMS: {analysis_results['time_stats']['rms']:.4f}
        Peak: {analysis_results['time_stats']['peak']:.4f}
        Crest Factor: {analysis_results['time_stats']['crest_factor']:.2f}
        
        Dominant Freq: {analysis_results['spectral_stats']['dominant_frequency']:.1f} Hz
        Spectral Centroid: {analysis_results['spectral_stats']['spectral_centroid']:.1f} Hz
        Zero Crossing Rate: {analysis_results['spectral_stats']['zero_crossing_rate']:.4f}
        """
        axes[2, 1].text(0.1, 0.5, stats_text, fontsize=10, verticalalignment='center')
        axes[2, 1].set_title('Signal Statistics')
        axes[2, 1].axis('off')
        
        plt.tight_layout()
        return fig

# Example usage
if __name__ == "__main__":
    # Create test signal
    fs = 1000  # Sampling frequency
    t = np.linspace(0, 2, 2 * fs, False)
    
    # Complex test signal with multiple components
    signal_data = (np.sin(2 * np.pi * 50 * t) + 
                   0.5 * np.sin(2 * np.pi * 120 * t) + 
                   0.2 * np.random.normal(0, 1, len(t)))
    
    # Initialize processor
    processor = AdvancedSignalProcessor(fs)
    
    # Perform analysis
    analysis = processor.spectral_analysis(signal_data)
    
    # Create visualization
    visualizer = SignalVisualizer()
    fig = visualizer.plot_signal_analysis(signal_data, analysis, fs, 
                                        "Advanced Signal Processing Example")
    plt.show()
```

This advanced signal processing framework provides professional-grade tools for analyzing complex signals across multiple domains. The modular architecture supports biomedical, audio, and general signal processing applications with comprehensive analysis and visualization capabilities.

For foundational signal processing concepts, see our [AM wave generation tutorial](/blog/2011/09/25/am-plot-matplotlib/). For related data analysis techniques, explore our [data visualization guides](#).