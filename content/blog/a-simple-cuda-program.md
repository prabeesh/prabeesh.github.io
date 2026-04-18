---
title: "A Simple CUDA Program: Squaring 64 Numbers on the GPU"
date: 2013-03-07T11:00:00+05:30
author: Prabeesh Keezhathra
tags: [CUDA, GPU Programming, Parallel Computing, NVIDIA, C Programming]
keywords:
  - CUDA programming tutorial
  - CUDA kernel example
  - cudaMalloc cudaMemcpy
  - nvcc compiler
  - NVIDIA GPU programming
description: A simple CUDA program that computes the squares of 64 numbers on the GPU. Covers memory allocation, host-device transfer, and kernel launch.
---

Following on from my [introduction to parallel programming](/blog/2013/02/22/introduction-to-parallel-programming/), this post walks through a simple CUDA program that computes the squares of 64 numbers on the GPU. The source is on [GitHub](https://github.com/prabeesh/CUDA-code-square/blob/master/square.cu).

## A typical GPU program

A typical CUDA program follows four steps:

1. CPU allocates storage on the GPU
2. CPU copies input data from CPU to GPU
3. CPU launches kernels on the GPU to process the data
4. CPU copies the result back from GPU to CPU

## Compiling

```c
nvcc -o square square.cu
```

Instead of the regular C compiler, we use `nvcc`, the NVIDIA C Compiler. The output is an executable called `square` and the input file is `square.cu`. `.cu` is the convention for CUDA source files.

## The host code

We'll walk through the CPU side first. <!--more-->

```c
int main(int argc, char ** argv) { 
    const int ARRAY_SIZE = 64; 
    const int ARRAY_BYTES = ARRAY_SIZE * sizeof(float);
    // generate the input array on the host float h_in[ARRAY_SIZE]; 
    for (int i = 0; i &lt; ARRAY_SIZE; i++) {  
        h_in[i] = float(i); 
    } 

float h_out[ARRAY_SIZE]
....
.....
}
```

First we declare the array size and how many bytes it uses, then fill it with floating-point numbers where element `i` is set to `i`. All standard C so far, nothing GPU-specific. One CUDA convention to note: data on the CPU (the host) starts with `h`; data on the GPU (the device) starts with `d`.

```c
// declare GPU memory pointers 
float * d_in; 
float * d_out;
```

Pointers on the GPU are declared the same way as on the CPU, just a `float *`. The difference is what they point to: if you access a CPU pointer as GPU memory (or vice versa), you'll have a bad time.

```c
// allocate GPU memory 
cudaMalloc((void**) &d_in, ARRAY_BYTES); 
cudaMalloc((void**) &d_out, ARRAY_BYTES);
```

`cudaMalloc` takes two arguments, the pointer and the number of bytes to allocate. It allocates data on the GPU, whereas a plain `malloc` would allocate on the CPU.

```c
// transfer the array to the GPU 
cudaMemcpy(d_in, h_in, ARRAY_BYTES, cudaMemcpyHostToDevice);
```

`cudaMemcpy` copies the array `h_in` from the CPU to the array `d_in` on the GPU. It's like a regular `memcpy`, but with a fourth argument that specifies the transfer direction. The three options are `cudaMemcpyHostToDevice`, `cudaMemcpyDeviceToHost`, and `cudaMemcpyDeviceToDevice`.

## Launching the kernel

```c
// launch the kernel 
square<<<dim3(1,1,1), dim3(64,1,1)>>>(d_out, d_in);
```

This is the CUDA launch operator:

```
<<<someparameters>>>;
```

The line says: launch the kernel `square` on one block of 64 elements. The arguments to the kernel are two pointers, `d_out` and `d_in`. This tells the CPU to launch 64 copies of the kernel on 64 threads. The kernel can only be called on GPU data, not CPU data. After the kernel runs, a second `cudaMemcpy` moves memory from device to host into `h_out`.

```c
// print out the resulting array 
for (int i =0; i ; ARRAY_SIZE; i++) {  
    printf("%f", h_out[i]);  
    printf(((i % 4) != 3) ? "\t" : "\n"); 
}
    cudaFree(d_in); c
    udaFree(d_out); 
    return 0;
```

We walk through `h_out`, print four values per line, then free the GPU memory. Most CUDA programs follow the same shape: create data on the CPU, allocate on the GPU, copy CPU -> GPU, launch kernels, copy GPU -> CPU, continue processing.

## The kernel

```c
__global__ void square(float * d_out, float * d_in){    
    int idx = threadIdx.x;    
    float f = d_in[idx];    
    d_out[idx] = f * f;
}
```

The kernel looks like a serial program that runs on one thread. The CPU is responsible for launching it on many parallel threads. The `__global__` qualifier is how CUDA knows this is a kernel rather than CPU code. `void` means the kernel doesn't return a value; it writes its output into the pointer passed in.

The body:

- `threadIdx.x` gives each thread its index within the block. `threadIdx` is a struct with `.x`, `.y`, `.z` members (a `dim3`). With 64 threads launched, the first instance returns 0, the next 1, up to 63 for the last.
- Each thread reads its array element from global memory into `f`, squares it, and writes the result back to the output array at the same index.

That's it. Everything else looks like straightforward C.

This post is from my notes while taking the Udacity [Intro to Parallel Programming](https://www.udacity.com/course/cs344) course.
