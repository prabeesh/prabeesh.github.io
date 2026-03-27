---
title: "GPU Computing with CUDA: Advanced Parallel Programming Techniques"
date: 2023-12-18T13:15:00+01:00
draft: false
tags: [CUDA, GPU computing, parallel programming, high-performance computing, NVIDIA, GPU optimization, memory management, stream processing]
keywords: CUDA advanced programming, GPU parallel computing, CUDA optimization techniques, GPU memory management, CUDA streams, high-performance computing, NVIDIA GPU programming, parallel algorithms CUDA
description: Master advanced CUDA programming techniques for high-performance GPU computing. Learn memory optimization, stream processing, cooperative groups, and performance tuning strategies for professional GPU applications.
---

Building upon our foundational [CUDA programming concepts](/blog/a-simple-cuda-program/), this advanced guide explores sophisticated GPU computing techniques essential for high-performance applications. We'll cover memory optimization patterns, advanced parallel algorithms, and production-ready CUDA development practices.

## Advanced Memory Management Patterns

### Unified Memory with Prefetching

```cpp
#include <cuda_runtime.h>
#include <iostream>
#include <vector>
#include <chrono>

class UnifiedMemoryManager {
private:
    size_t totalSize;
    void* managedPtr;
    cudaStream_t stream;
    
public:
    UnifiedMemoryManager(size_t size) : totalSize(size) {
        // Allocate unified memory
        cudaMallocManaged(&managedPtr, totalSize);
        cudaStreamCreate(&stream);
        
        // Set memory advice for optimization
        cudaMemAdvise(managedPtr, totalSize, cudaMemAdviseSetPreferredLocation, 0);
        cudaMemAdvise(managedPtr, totalSize, cudaMemAdviseSetAccessedBy, cudaCpuDeviceId);
    }
    
    ~UnifiedMemoryManager() {
        cudaStreamSynchronize(stream);
        cudaFree(managedPtr);
        cudaStreamDestroy(stream);
    }
    
    template<typename T>
    T* getPointer() {
        return static_cast<T*>(managedPtr);
    }
    
    void prefetchToGPU(int device = 0) {
        cudaMemPrefetchAsync(managedPtr, totalSize, device, stream);
    }
    
    void prefetchToCPU() {
        cudaMemPrefetchAsync(managedPtr, totalSize, cudaCpuDeviceId, stream);
    }
    
    void synchronize() {
        cudaStreamSynchronize(stream);
    }
};

// Advanced matrix multiplication with memory optimization
template<typename T>
class AdvancedMatrixMultiply {
private:
    static const int TILE_SIZE = 16;
    static const int BLOCK_SIZE = 16;
    
public:
    __device__ static void tiledMatMul(const T* A, const T* B, T* C, 
                                      int N, int M, int K) {
        // Shared memory for tiles
        __shared__ T As[TILE_SIZE][TILE_SIZE];
        __shared__ T Bs[TILE_SIZE][TILE_SIZE];
        
        int bx = blockIdx.x, by = blockIdx.y;
        int tx = threadIdx.x, ty = threadIdx.y;
        
        int row = by * TILE_SIZE + ty;
        int col = bx * TILE_SIZE + tx;
        
        T sum = 0;
        
        // Loop over tiles
        for (int t = 0; t < (K + TILE_SIZE - 1) / TILE_SIZE; ++t) {
            // Load tiles into shared memory
            if (row < N && (t * TILE_SIZE + tx) < K) {
                As[ty][tx] = A[row * K + t * TILE_SIZE + tx];
            } else {
                As[ty][tx] = 0;
            }
            
            if (col < M && (t * TILE_SIZE + ty) < K) {
                Bs[ty][tx] = B[(t * TILE_SIZE + ty) * M + col];
            } else {
                Bs[ty][tx] = 0;
            }
            
            __syncthreads();
            
            // Compute partial sum
            for (int k = 0; k < TILE_SIZE; ++k) {
                sum += As[ty][k] * Bs[k][tx];
            }
            
            __syncthreads();
        }
        
        // Write result
        if (row < N && col < M) {
            C[row * M + col] = sum;
        }
    }
};

__global__ void optimizedMatMulKernel(const float* A, const float* B, float* C,
                                     int N, int M, int K) {
    AdvancedMatrixMultiply<float>::tiledMatMul(A, B, C, N, M, K);
}
```

### Memory Pool Management

```cpp
class CUDAMemoryPool {
private:
    struct MemoryBlock {
        void* ptr;
        size_t size;
        bool inUse;
        cudaStream_t stream;
        
        MemoryBlock(size_t sz) : size(sz), inUse(false), stream(nullptr) {
            cudaMalloc(&ptr, size);
        }
        
        ~MemoryBlock() {
            if (ptr) cudaFree(ptr);
        }
    };
    
    std::vector<std::unique_ptr<MemoryBlock>> blocks;
    std::mutex poolMutex;
    size_t totalAllocated = 0;
    size_t maxPoolSize;
    
public:
    CUDAMemoryPool(size_t maxSize = 1024 * 1024 * 1024) : maxPoolSize(maxSize) {} // 1GB default
    
    void* allocate(size_t size, cudaStream_t stream = nullptr) {
        std::lock_guard<std::mutex> lock(poolMutex);
        
        // Find available block
        for (auto& block : blocks) {
            if (!block->inUse && block->size >= size) {
                block->inUse = true;
                block->stream = stream;
                return block->ptr;
            }
        }
        
        // Create new block if under limit
        if (totalAllocated + size <= maxPoolSize) {
            auto newBlock = std::make_unique<MemoryBlock>(size);
            void* ptr = newBlock->ptr;
            newBlock->inUse = true;
            newBlock->stream = stream;
            totalAllocated += size;
            blocks.push_back(std::move(newBlock));
            return ptr;
        }
        
        return nullptr; // Pool exhausted
    }
    
    void deallocate(void* ptr, cudaStream_t stream = nullptr) {
        std::lock_guard<std::mutex> lock(poolMutex);
        
        for (auto& block : blocks) {
            if (block->ptr == ptr) {
                if (stream) {
                    // Asynchronous deallocation
                    cudaStreamSynchronize(stream);
                }
                block->inUse = false;
                block->stream = nullptr;
                break;
            }
        }
    }
    
    void cleanup() {
        std::lock_guard<std::mutex> lock(poolMutex);
        
        // Remove unused blocks to free memory
        blocks.erase(
            std::remove_if(blocks.begin(), blocks.end(),
                          [](const std::unique_ptr<MemoryBlock>& block) {
                              return !block->inUse;
                          }),
            blocks.end()
        );
    }
    
    size_t getTotalAllocated() const { return totalAllocated; }
    size_t getBlockCount() const { return blocks.size(); }
};

// Global memory pool instance
CUDAMemoryPool g_memoryPool;
```

## Advanced Stream Processing and Concurrency

### Multi-Stream Pipeline Processing

```cpp
class CUDAStreamPipeline {
private:
    std::vector<cudaStream_t> streams;
    std::vector<cudaEvent_t> events;
    int numStreams;
    
public:
    CUDAStreamPipeline(int streamCount = 4) : numStreams(streamCount) {
        streams.resize(numStreams);
        events.resize(numStreams);
        
        for (int i = 0; i < numStreams; ++i) {
            cudaStreamCreate(&streams[i]);
            cudaEventCreate(&events[i]);
        }
    }
    
    ~CUDAStreamPipeline() {
        for (int i = 0; i < numStreams; ++i) {
            cudaStreamDestroy(streams[i]);
            cudaEventDestroy(events[i]);
        }
    }
    
    template<typename T>
    void processDataPipeline(T* hostData, T* deviceData, size_t dataSize,
                            void(*kernel)(T*, size_t, cudaStream_t),
                            T* resultData) {
        
        const size_t chunkSize = dataSize / numStreams;
        
        // Launch asynchronous operations on multiple streams
        for (int i = 0; i < numStreams; ++i) {
            size_t offset = i * chunkSize;
            size_t currentChunkSize = (i == numStreams - 1) ? 
                                    dataSize - offset : chunkSize;
            
            // Async memory copy H2D
            cudaMemcpyAsync(deviceData + offset, hostData + offset,
                          currentChunkSize * sizeof(T),
                          cudaMemcpyHostToDevice, streams[i]);
            
            // Launch kernel
            kernel(deviceData + offset, currentChunkSize, streams[i]);
            
            // Async memory copy D2H
            cudaMemcpyAsync(resultData + offset, deviceData + offset,
                          currentChunkSize * sizeof(T),
                          cudaMemcpyDeviceToHost, streams[i]);
            
            // Record event for synchronization
            cudaEventRecord(events[i], streams[i]);
        }
        
        // Wait for all streams to complete
        for (int i = 0; i < numStreams; ++i) {
            cudaEventSynchronize(events[i]);
        }
    }
    
    void synchronizeAll() {
        for (int i = 0; i < numStreams; ++i) {
            cudaStreamSynchronize(streams[i]);
        }
    }
    
    cudaStream_t getStream(int index) {
        return streams[index % numStreams];
    }
};

// Example: Parallel signal processing
__global__ void signalProcessingKernel(float* data, size_t size, 
                                     float filter_coef, cudaStream_t stream) {
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    int stride = blockDim.x * gridDim.x;
    
    for (int i = idx; i < size; i += stride) {
        // Apply digital filter
        if (i > 0) {
            data[i] = data[i] * filter_coef + data[i-1] * (1.0f - filter_coef);
        }
        
        // Apply windowing function (Hamming window)
        float window = 0.54f - 0.46f * cosf(2.0f * M_PI * i / size);
        data[i] *= window;
    }
}

void processSignalData(float* hostSignal, size_t signalLength) {
    CUDAStreamPipeline pipeline(8);  // 8 concurrent streams
    
    float* deviceSignal;
    cudaMalloc(&deviceSignal, signalLength * sizeof(float));
    
    float* processedSignal = new float[signalLength];
    
    auto kernelWrapper = [](float* data, size_t size, cudaStream_t stream) {
        int blockSize = 256;
        int gridSize = (size + blockSize - 1) / blockSize;
        signalProcessingKernel<<<gridSize, blockSize, 0, stream>>>(
            data, size, 0.8f, stream
        );
    };
    
    pipeline.processDataPipeline(hostSignal, deviceSignal, signalLength,
                               kernelWrapper, processedSignal);
    
    cudaFree(deviceSignal);
    delete[] processedSignal;
}
```

## Cooperative Groups and Advanced Synchronization

```cpp
#include <cooperative_groups.h>
namespace cg = cooperative_groups;

// Advanced reduction using cooperative groups
template<typename T>
__device__ T cooperativeReduce(cg::thread_block block, T* data, int size) {
    // Shared memory for block-level reduction
    extern __shared__ T sdata[];
    
    int tid = threadIdx.x;
    int blockSize = block.size();
    
    // Load data into shared memory
    T sum = 0;
    for (int i = tid; i < size; i += blockSize) {
        sum += data[i];
    }
    sdata[tid] = sum;
    
    cg::sync(block);
    
    // Cooperative reduction in shared memory
    for (int s = blockSize / 2; s > 32; s >>= 1) {
        if (tid < s) {
            sdata[tid] += sdata[tid + s];
        }
        cg::sync(block);
    }
    
    // Warp-level reduction using shuffle
    if (tid < 32) {
        cg::coalesced_group active = cg::coalesced_threads();
        T warpSum = sdata[tid];
        
        for (int offset = active.size() / 2; offset > 0; offset /= 2) {
            warpSum += active.shfl_down(warpSum, offset);
        }
        
        if (active.thread_rank() == 0) {
            sdata[0] = warpSum;
        }
    }
    
    cg::sync(block);
    return sdata[0];
}

// Multi-block cooperative kernel
__global__ void cooperativeMatrixTranspose(float* input, float* output,
                                         int rows, int cols) {
    // Create grid group for multi-block cooperation
    cg::grid_group grid = cg::this_grid();
    cg::thread_block block = cg::this_thread_block();
    
    const int TILE_SIZE = 32;
    __shared__ float tile[TILE_SIZE][TILE_SIZE + 1]; // +1 to avoid bank conflicts
    
    int blockIdx_x = blockIdx.x;
    int blockIdx_y = blockIdx.y;
    int threadIdx_x = threadIdx.x;
    int threadIdx_y = threadIdx.y;
    
    // Calculate input and output indices
    int in_row = blockIdx_y * TILE_SIZE + threadIdx_y;
    int in_col = blockIdx_x * TILE_SIZE + threadIdx_x;
    int out_row = blockIdx_x * TILE_SIZE + threadIdx_y;
    int out_col = blockIdx_y * TILE_SIZE + threadIdx_x;
    
    // Load tile from input matrix
    if (in_row < rows && in_col < cols) {
        tile[threadIdx_y][threadIdx_x] = input[in_row * cols + in_col];
    } else {
        tile[threadIdx_y][threadIdx_x] = 0.0f;
    }
    
    cg::sync(block);
    
    // Store transposed tile to output matrix
    if (out_row < cols && out_col < rows) {
        output[out_row * rows + out_col] = tile[threadIdx_x][threadIdx_y];
    }
    
    // Grid-level synchronization for multi-block coordination
    cg::sync(grid);
}

// Launch cooperative kernel
void launchCooperativeTranspose(float* d_input, float* d_output,
                               int rows, int cols) {
    const int TILE_SIZE = 32;
    dim3 blockSize(TILE_SIZE, TILE_SIZE);
    dim3 gridSize((cols + TILE_SIZE - 1) / TILE_SIZE,
                  (rows + TILE_SIZE - 1) / TILE_SIZE);
    
    // Check if device supports cooperative launch
    int device;
    cudaGetDevice(&device);
    int supportsCoopLaunch = 0;
    cudaDeviceGetAttribute(&supportsCoopLaunch,
                          cudaDevAttrCooperativeLaunch, device);
    
    if (supportsCoopLaunch) {
        void* kernelArgs[] = { &d_input, &d_output, &rows, &cols };
        cudaLaunchCooperativeKernel((void*)cooperativeMatrixTranspose,
                                  gridSize, blockSize, kernelArgs, 0, 0);
    } else {
        // Fallback to regular kernel launch
        cooperativeMatrixTranspose<<<gridSize, blockSize>>>(
            d_input, d_output, rows, cols
        );
    }
}
```

## Performance Profiling and Optimization

```cpp
class CUDAPerformanceProfiler {
private:
    std::map<std::string, cudaEvent_t> startEvents;
    std::map<std::string, cudaEvent_t> stopEvents;
    std::map<std::string, float> timings;
    
public:
    CUDAPerformanceProfiler() {}
    
    ~CUDAPerformanceProfiler() {
        for (auto& pair : startEvents) {
            cudaEventDestroy(pair.second);
        }
        for (auto& pair : stopEvents) {
            cudaEventDestroy(pair.second);
        }
    }
    
    void startTimer(const std::string& name, cudaStream_t stream = 0) {
        if (startEvents.find(name) == startEvents.end()) {
            cudaEventCreate(&startEvents[name]);
            cudaEventCreate(&stopEvents[name]);
        }
        cudaEventRecord(startEvents[name], stream);
    }
    
    void stopTimer(const std::string& name, cudaStream_t stream = 0) {
        cudaEventRecord(stopEvents[name], stream);
        cudaEventSynchronize(stopEvents[name]);
        
        float milliseconds = 0;
        cudaEventElapsedTime(&milliseconds, startEvents[name], stopEvents[name]);
        timings[name] = milliseconds;
    }
    
    float getElapsedTime(const std::string& name) {
        return timings[name];
    }
    
    void printTimings() {
        std::cout << "CUDA Performance Report:" << std::endl;
        std::cout << "========================" << std::endl;
        for (const auto& pair : timings) {
            std::cout << pair.first << ": " << pair.second << " ms" << std::endl;
        }
    }
    
    // Memory bandwidth calculation
    double calculateBandwidth(const std::string& timerName, size_t bytes) {
        float timeMs = timings[timerName];
        double timeS = timeMs / 1000.0;
        double bandwidthGBps = (bytes / (1024.0 * 1024.0 * 1024.0)) / timeS;
        return bandwidthGBps;
    }
};

// Usage example with comprehensive optimization
void optimizedVectorAddition(float* a, float* b, float* c, int n) {
    CUDAPerformanceProfiler profiler;
    
    // Memory allocation timing
    profiler.startTimer("memory_allocation");
    float *d_a, *d_b, *d_c;
    cudaMalloc(&d_a, n * sizeof(float));
    cudaMalloc(&d_b, n * sizeof(float));
    cudaMalloc(&d_c, n * sizeof(float));
    profiler.stopTimer("memory_allocation");
    
    // Memory transfer timing
    profiler.startTimer("memory_transfer_h2d");
    cudaMemcpy(d_a, a, n * sizeof(float), cudaMemcpyHostToDevice);
    cudaMemcpy(d_b, b, n * sizeof(float), cudaMemcpyHostToDevice);
    profiler.stopTimer("memory_transfer_h2d");
    
    // Kernel execution timing
    profiler.startTimer("kernel_execution");
    int threadsPerBlock = 256;
    int blocksPerGrid = (n + threadsPerBlock - 1) / threadsPerBlock;
    
    // Launch optimized kernel with proper grid configuration
    vectorAddKernel<<<blocksPerGrid, threadsPerBlock>>>(d_a, d_b, d_c, n);
    profiler.stopTimer("kernel_execution");
    
    // Memory transfer back timing
    profiler.startTimer("memory_transfer_d2h");
    cudaMemcpy(c, d_c, n * sizeof(float), cudaMemcpyDeviceToHost);
    profiler.stopTimer("memory_transfer_d2h");
    
    // Calculate and report performance metrics
    profiler.printTimings();
    
    size_t totalBytes = 3 * n * sizeof(float); // Read a, b; Write c
    double bandwidth = profiler.calculateBandwidth("kernel_execution", totalBytes);
    std::cout << "Effective Bandwidth: " << bandwidth << " GB/s" << std::endl;
    
    // Cleanup
    cudaFree(d_a);
    cudaFree(d_b);
    cudaFree(d_c);
}
```

This advanced CUDA programming guide provides sophisticated techniques for high-performance GPU computing. The patterns and optimizations shown here enable efficient utilization of modern GPU architectures for compute-intensive applications.

For foundational CUDA concepts, refer to our [basic CUDA programming tutorial](/blog/a-simple-cuda-program/) and explore related [parallel computing techniques](#).