---
title: "Install Apache Spark on Ubuntu-14.04"
date: 2014-10-31 13:58:31 +0530
tags: [Apache Spark, Big Data]
keywords: install spark on ubuntu, spark installation on ubuntu 14.04, installing spark on ubuntu, apache spark installation guide, installing apache spark, spark on ubuntu, apache spark installation, install spark in ubuntu, how to install spark ubuntu, apache spark cluster, install spark ubuntu 14.04, spark on ubuntu server, install spark on Ubuntu server, spark ubuntu LTS install, spark setup tutorial, spark single machine, running spark single machine, spark setup ubuntu machine
description: set up Spark on Ubuntu, Install Spark on Ubuntu, Apache Spark set up in Ubuntu
---
Update: For Apache Spark 2 refer latest [post](/blog/2016/12/07/install-apache-spark-2-on-ubuntu-16-dot-04-and-mac-os/)
--- 

One of the [previous post](/blog/2013/11/26/installing-apache-spark-on-ubuntu-1204/) mentioning about install **Apache Spark-0.8.0** on Ubuntu-12.04. In this post  explain about detailed steps to set up **Apache Spark-1.1.0** on Ubuntu. For running Spark in Ubuntu machine should install Java.  Using following commands  easily install Java in Ubuntu machine.
```
	$ sudo apt-add-repository ppa:webupd8team/java
	$ sudo apt-get update
	$ sudo apt-get install oracle-java7-installer
```
 To check the Java installation is successful 
```
	$ java -version
```
It shows installed java version

`
java version "1.7.0_72"_ 
Java(TM) SE Runtime Environment (build 1.7.0_72-b14)_ 
Java HotSpot(TM) 64-Bit Server VM (build 24.72-b04, mixed mode)
`

In next step is install Scala, follow the following 
instructions to set up Scala. <!--more--> First download the Scala from [here](http://www.scala-lang.org/download/2.10.4.html)


Copy downloaded file to some location for example _/urs/local/src_, 
untar the file and set path variable,
```
	$ wget http://www.scala-lang.org/files/archive/scala-2.10.4.tgz
	$ sudo mkdir /usr/local/src/scala
	$ sudo tar xvf scala-2.10.4.tgz -C /usr/local/src/scala/
```
```
	$ vi .bashrc
```
And add following in the end of the file
```	
	export SCALA_HOME=/usr/local/src/scala/scala-2.10.4
	export PATH=$SCALA_HOME/bin:$PATH
```
restart bashrc
```
	$ . .bashrc
```
To check the Scala is installed successfully
```
	$ scala -version
```
It shows installed Scala version
`
Scala code runner version 2.10.4 -- Copyright 2002-2013, LAMP/EPFL
`

Or just type scala. It goes to scala interactive shell
```
	$ scala
	scala>
```
In next step install git. Spark build depends on git.
```
sudo apt-get install git
```
Finally, download spark ditribution from [here](http://d3kbcqa49mib13.cloudfront.net/spark-1.1.0.tgz) 
```
	$ wget http://d3kbcqa49mib13.cloudfront.net/spark-1.1.0.tgz
	$ tar xvf spark-1.1.0.tgz 
```
### Building

SBT(Simple Build Tool) is used for building Spark, which is bundled with it. To compile the code
```
	$ cd spark-1.1.0

	$ sbt/sbt assembly
```
The building takes some time. After successfully packing you can test a sample program
```
	$ ./bin/run-example SparkPi 10
```
Then you get the output as Pi is roughly 3.14634. Spark is ready to fire

For more detail [visit](http://spark.apache.org/docs/1.1.1/)

### Spark Interactive Shell
You can run Spark interactively through the Scala shell
```
	$ ./bin/spark-shell
```
```scala
	scala> val textFile = sc.textFile("README.md")
	scala> textFile.count()
```
If want to check some particular sections of spark using shell. For example run MQTT interactevely, the mqtt is defined under external for import that into _spark-shell_ just follow the instructions
```
	$ sbt/sbt "streaming-mqtt/package"
```
Then add this package into the classpath

```
	$ bin/spark-shell --driver-class-path
external/mqtt/target/scala-2.10/spark-streaming-mqtt_2.10-1.1.0.jar
	scala > import org.apache.spark.streaming.mqtt._
```
Using this you can check your code line by line.
### Accessing Hadoop Filesystems
If you have already the build source package, rebuild it against the hadoop version as follows
```
	$ sbt/sbt clean
```
You can change this by setting the SPARK_HADOOP_VERSION variable. Here uses Hadoop 2.0.0-cdh4.3.0
```
	$ SPARK_HADOOP_VERSION=2.0.0-mr1-cdh4.3.0 sbt/sbt assembly
```
After successfully build. You can read  and write data into cdh4.3.0 clusters.
```
	$ .bin/spark-shell
```
```scala
	scala> var file = sc.textFile("hdfs://IP:8020/path/to/textfile.txt")
	scala>  file.flatMap(line => line.split(",")).map(word => (word, 1)).reduceByKey(_+_)
	scala> count.saveAsTextFile("hdfs://IP:8020/path/to/ouput")
```
You may find more [here](http://spark.apache.org/docs/1.1.1/quick-start.html)
