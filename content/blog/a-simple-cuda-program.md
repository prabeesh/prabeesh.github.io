---
title: Simple CUDA program
date: 2013-03-07T11:00:00+05:30
keywords: simple CUDA program, CUDA basic example, introduction to CUDA programming, CUDA for beginners, CUDA examples
---
In my [previous post](/blog/2013/02/22/introduction-to-parallel-programing/) I wrote about an introduction to parallel programming with CUDA. In this post explaining a simple example CUDA code to compute squares of 64 numbers. A typical GPU program consists of following steps.

    1- CPU allocates storage on GPU
    2- CPU copies input data from CPU to GPU
    3- CPU launch kernels on GPU to process the data
    4- CPU copies result back to CPU from GPU

```c
nvcc -o square square.cu
```
Here is instead of running the regular C compiler we are running *nvcc*, the Nvidia C Compiler. The output is going to go an executable called square and our input file is "square.cu". cu is the convention for how we name.Source code is available on [github](https://github.com/prabeesh/CUDA-code-square/blob/master/square.cu)


We are going to walk through the CPU code first. <!--more-->
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

The first thing we are going to do is declare the size of the array and determine how many bytes it uses. We then fill it up in this loop with floating point numbers, where array element i is simply set to i. All of this is standard C, nothing GPU specific so far. One thing to note, though, is a common CUDA convention. Data on the CPU, the host, starts with h. Data on the GPU, the device, starts with d. This is just a convention.
```c
// declare GPU memory pointers 
float * d_in; 
float * d_out;
```
If you're accessing data through a point or on the CPU, your pointer better points to something in CPU memory, or you're going to have a bad time. Same thing for the GPU. And the first interesting thing that you see is how to declare a pointer on the GPU. It looks just like a pointer declared on the CPU. It's just a float star.
```c
// allocate GPU memory 
cudaMalloc((void**) &d_in, ARRAY_BYTES); 
cudaMalloc((void**) &d_out, ARRAY_BYTES);
```
Now, to tell Cuda that your data is actually on the GPU, not the CPU. We are using cudaMalloc with two arguments, the pointer and the number of bytes to allocate. cudaMalloc means to allocate the data on the GPU whereas, a plain Malloc would mean allocate the data on a CPU.
```c
// transfer the array to the GPU 
cudaMemcpy(d_in, h_in, ARRAY_BYTES, cudaMemcpyHostToDevice);
```
The next thing we do is actually copy the data from the CPU the array h_in on to the GPU, the array din. This call is cudaMemcpy. It's just like a regular Memcpy, but it takes four arguments instead of three. The first three arguments are the same as regular C Memcpy, the destination, the source, and the number of bytes. The fourth argument says the direction of the transfer. The three choices are Cuda memory host to device, Cuda memory device to host, and Cuda memory device to device.
```c
// launch the kernel 
square<<<dim3(1,1,1), dim3(64,1,1)>>>(d_out, d_in);
```
Now consider how do we actually launch kernal on the GPU. So, here is a new piece of syntax in CUDA, the CUDA launch operator. So, the CUDA launch operator 
```
<<<someparameters>>>; 
```
So, this line says, launch the kernel name square on one block of 64 elements. Then, the arguments to the kernel are two pointers, d_out and d_in. This code tells the CPU to launch on the GPU 64 copies of the kernel on 64 threads. Note that we can only call the kernel on GPU data, not CPU data. And this cudaMemcpy call will move memory from device to host, and place it in h_out.
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
The next thing we do is print it out. We are just walking through the h_out array, we are printing four things per line, so we are;putting tabs in and then a new line after four, and then we free the memory that we allocated on the GPU and return 0. So, that's all the CPU code.; ;Most programs are going to have you create some data on the CPU, allocate;some data on the GPU, copy memory from CPU to GPU, launch some kernels that will run on the GPU, copy the result back to the CPU and then, continue;to process them, print them, and so on.
```c
__global__ void square(float * d_out, float * d_in){    
    int idx = threadIdx.x;    
    float f = d_in[idx];    
    d_out[idx] = f * f;
}
```
Now let's look at the kernel itself. Recall that this will look like a serial program that will run on one thread. And the CPU is responsible for launching that;program on many parallel threads. This kernel indeed looks exactly like a serial program.

Just know that this is the way;that CUDA knows this code is a kernel as opposed to CPU code. Next we have void. Void just means the kernel doesn't return a value. Instead it writes the;output into the pointer specified in its argument list. This kernel takes two arguments. These are pointers to the output and the input arrays.

Let's walk through the body of the kernel. So the first line of the body here. CUDA has a built in variable called thread index, threadIDX, and that's going to tell each thread its index within a block. threadIDX is actually a c struct with 3 members. .x, .y, and .z. the c struct is called a dim 3. Now, we will launch 64 threads. So for the first instance of those threads, threadIDX.x will return zero, for the second instance, 1. And so on, up to 63 for the last element. Everything else in this kernel just looks like straightforward C. It looks just like a serial program.

For each thread, we're going to first read the array element corresponding to this thread index from global memory. We are going to store it in this float;variable f. We are then going to square f, and we're going to write that value back to global memory, in the output array element that corresponds to our thread index.

This blog is my short notes as part of the course now I am doing in the Udacity [Intro to Parallel Programming](https://www.udacity.com/course/cs344)
