---
title: "Running Mesos-0.13.0  on Ubuntu-12.04"
date: 2013-10-07T10:53:00+05:30
tags: [Big Data, Apache Mesos]
keywords: mesos, apache spark mesos, spark mesos cluster setup, spark deploy installation, mesos installation, set up mesos on ubuntu, ubuntu mesos apt get, ubuntu spark with mesos, mesos cluster configuration
description: This guide provides step-by-step instructions for installing Mesos on Ubuntu 12.04 and setting up a cluster for Apache Spark. It covers the necessary packages, Java installation, downloading and untarring the Mesos distribution, building and installing Mesos, starting the Mesos cluster, and configuring the Mesos client. By following this guide, you will be able to run applications against the Mesos cluster from your client machine.
---
You will need the following packages to run Mesos.
```
$ sudo apt-get install python2.7-dev g++ libcppunit-dev libunwind7-dev git libcurl4-nss-dev
```
You need to have Java installed, or the JAVA_HOME environment variable pointing to a Java installation.

You can download the Mesos distribution from [official website](http://www.apache.org/dyn/closer.cgi/mesos/0.13.0/). After that untar the downloaded file
```
$ tar xvf mesos-0.13.0.tar.gz
```
### Building and Installing
``` 
$ cd mesos-0.13.0
$ mkdir build
$ cd build
$ sudo  ../configure --prefix=/home/user/mesos
$ sudo make
$ sudo make check
$ sudo make install
```
You can pass the --prefix option while configuring to tell where to install. For example <!--more-->, pass`__--prefix=/home/user/mesos__`. By default the prefix is `__/usr/local__`.
Once you are done with the installation, it is now time to start your mesos cluster:

Go into the directory where you built Mesos.
```
$ cd mesos-0.13.0/build/bin
```
Run the command to launch the master.
```
$ sh mesos-master.sh 
```  
Take note of the IP and port that the master is running on, which will look something like **__[IP of the machine]:5050__**. 
URL of master: __mesos://[IP of the machine]:5050__. View the master's web UI at __`http://[IP of the machine]:5050`__.

Copy mesos-0.13.0 and mesos to the same paths on all the nodes in the cluster. To launch a slave, go to below directory 
```
$ cd mesos-0.13.0/build/src
```
Run the command to launch the slave.
```
$ sh mesos-slave  --master=[IP of the mesos master machine ]:5050
```
The slave will show up on the mesos master's web UI.
### Mesos Client
Copy the libmesos.so from prefix folder(/home/user/mesos/lib) of the mesos master to /usr/local/lib of the client machine and install the following package
```
$ sudo apt-get install libunwind7-dev
```  
Now you can  run  applications against the Mesos cluster from the client machine.
