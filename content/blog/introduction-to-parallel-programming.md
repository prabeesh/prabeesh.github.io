---
title: "Introduction to Parallel Programming"
date: 2013-02-22 23:16:54 +0530
aliases:
  - /blog/2013/02/22/introduction-to-parallel-programing/
tags:
  - parallel programming
  - GPU computing
  - CUDA
keywords:
  - GPU parallel programming
  - CUDA programming model
  - GPGPU computing
  - parallel computing GPU
  - Udacity parallel programming
description: GPU parallel programming basics and the CUDA platform, summarised from the Udacity Intro to Parallel Programming course.
---
This post focuses on parallel computing on the GPU. Parallel computing solves large problems by breaking them into smaller pieces and running those pieces at the same time.

## Why GPUs for parallel computing

Modern processors are made from transistors. Each year those transistors get smaller. The feature size is the minimum size of a transistor on a chip. As it decreases, transistors get smaller, run faster, use less power, and you can fit more of them on a chip, giving more resources for computation every year.

One of the primary features of processors is clock speed. For many years clock speeds went up steadily, but over the last decade they have essentially remained constant. Even though transistors continue to get smaller, faster, and more power-efficient per transistor, running a billion of them generates a lot of heat. Because we cannot keep all these processors cool, power has become a primary design constraint.

<!-- more-->

Traditional CPUs have very complicated control hardware. That allows flexibility and performance, but as the control logic gets more complicated it becomes expensive in terms of power and design complexity. An alternative is to build simpler control structures and compensate with a large number of parallel compute units. Each unit is small, simple, and power-efficient, so you can put a large number of them on a single chip and program them to work together on complex problems. A high-end GPU contains over 3,000 ALUs that can run 3,000 arithmetic operations simultaneously. GPUs can have tens of thousands of active parallel threads, with up to 65,000 running concurrently. Together, all this computing power can solve problems faster than a single fast CPU core.

To build a power-efficient processor you have two choices: minimise latency (the time to complete one task) or maximise throughput (tasks completed per unit time). Maximising throughput is the right approach because latency lags bandwidth.

## CUDA (Compute Unified Device Architecture)

CUDA is a parallel programming platform and programming model created by NVIDIA. It gives developers access to the virtual instruction set and memory of the parallel computational elements in CUDA GPUs. Unlike CPUs, a GPU is a parallel throughput architecture that emphasises executing many concurrent threads slowly rather than executing a single thread very quickly. This approach to solving general-purpose problems on the GPU is known as GPGPU.

The CUDA programming model lets you program both the CPU and the GPU from one program. The typical workflow is:

1. The CPU allocates storage on the GPU.
2. The CPU copies input data from host memory to the GPU.
3. The CPU launches kernels that run on the GPU and process the data.
4. The CPU copies the results back from the GPU.

This post is a set of short notes from the Udacity [Intro to Parallel Programming](https://www.udacity.com/course/cs344) course.
