---
title: "Install Apache Spark 2 on Ubuntu 16.04 and Mac OS"
date: 2016-12-07 11:45:18 +0400
tags: [Apache Spark, Big Data, Ubuntu, Mac OS X]
keywords: install spark ubuntu-16.04, spark installation on mac os, installing spark on linux, installing apache spark 2.0, spark-2.0.2 installation, apache spark 2 installation on unix, install spark in ubuntu Mac OS X, how to install apache spark 2, apache spark cluster on Mac OS X, install spark ubuntu 16.04, spark on OS X Yosemite, install spark on Ubuntu server, spark ubuntu LTS install, spark-2 setup tutorial, spark 2 single machine, spark 2 setup ubuntu machine
description: set up Spark 2.0 in Ubuntu and OS X Sierra, Install Spark 2 on MAC OS, Apache Spark 2 set up in Linux
---
Two of the earlier posts are discussing installing [Apache Spark-0.8.0](/blog/2013/11/26/installing-apache-spark-on-ubuntu-1204/) and [Apache Spark-1.1.0](/blog/2014/10/31/install-apache-spark-on-ubuntu-14-dot-04/) on Ubuntu-12.04 and Ubuntu-14.04 respectively. In this post you can discover necessary actions to set up **Apache Spark-2.0.2** on Ubuntu 16.04 and Mac OS X Sierra. For enhanced guidance refer above mentioned posts.
<!--more--> 

Java should be installed in the machine to run Apache Spark. The subsequent commands help quickly install Java in **Ubuntu** machine.
```
	$ sudo apt-add-repository ppa:webupd8team/java
	$ sudo apt-get update
	$ sudo apt-get install oracle-java7-installer
```

To install Java in **Mac OS X** visit [oracle website](http://www.oracle.com/technetwork/java/javase/downloads/jdk7-downloads-1880260.html
) under `Java SE Development Kit 7u79` find and download `jdk-7u79-macosx-x64.dmg` file after accepting the license agreement, double click the downloaded dmg file and follow the instructions.

To check the Java installation is successful run following command in the terminal
```
	$ java -version
```
It exhibits installed java version

`
java version "1.7.0_72"_ 
Java(TM) SE Runtime Environment (build 1.7.0_72-b14)_ 
Java HotSpot(TM) 64-Bit Server VM (build 24.72-b04, mixed mode)
`

install git. Spark build depends on git. 
on **Ubuntu** run 
```
sudo apt-get install git
```
on **Mac OS X**
```
brew install git
```

Finally, downloaded and untar the apache spark 2 distribution to some location, for example `/usr/local/share/spark`.
```
	$ mkdir /usr/local/share/spark
	$ curl http://d3kbcqa49mib13.cloudfront.net/spark-2.0.2.tgz | tar xvz -C /usr/local/share/spark
```
### Building

Maven is used for building Spark, which is bundled with it. To build the apache spark run the following
```
	$ cd /usr/local/share/spark/spark-2.0.2

	$ ./build/mvn -DskipTests clean package
```
The building needs some time. After successfully packing you can test a sample program
```
	$ ./bin/run-example SparkPi 10
```
Then you get the output as `Pi is roughly 3.14634` along with the log. 

To build the apache spark for the particular version of hadoop use below command

```
./build/mvn -Pyarn -Phadoop-2.7 -Dhadoop.version=2.7.0 -DskipTests clean package
```
For more details about buiding apache spark again specific version of hadoop [refer](http://spark.apache.org/docs/latest/building-spark.html#specifying-the-hadoop-version) 

For step by step install of the Apache Spark on Ubuntu refer my previous [post](/blog/2014/10/31/install-apache-spark-on-ubuntu-14-dot-04/)
