---
layout: post
title: "Installing Apache Spark on Ubuntu-12.04"
date: 2013-11-26T12:24:00+05:30
comments: true
categories: [Apache Spark, BigData]
keywords: Spark with HDFS, Apache Spark, Spark Ubuntu, Set up Spark on ubuntu, Big Data Spark, Apache Spark Ubuntu, Install Spark on Ubuntu, Set up Spark, apache spark tutorial
description: set up Spark on Ubuntu, Install Spark on Ubuntu, Apache Spark set up in Ubuntu
---
Apache Spark is an open source in memory cluster computing framework. Initially developed in UC Berkely AMPLab and now an Apache Incubator Project.    Spark is a cluster computing framework designed for low-latency iterative jobs and interactive use from an interpreter. It provides clean, language-integrated APIs in Scala, Java, and Python, with a rich array of parallel operators. You may read more about it [here](http://spark.apache.org/)

You can download the Apache Spark distribution(0.8.0-incubating) from [here](http://d3kbcqa49mib13.cloudfront.net/spark-0.8.0-incubating.tgz). After that untar the downloaded file.
```
$ tar xvf spark-0.8.0-incubating.tgz
```
You need to have Scala installed, or the SCALA_HOME environment variable pointing to a Scala installation.

###Building
SBT(Simple Build Tool) is used for building Spark, which is bundled with it. To compile the code
```
$ cd spark-0.8.0-incubating

$sbt/sbt assembly
```
Building take some time. After successfully packing you can test a sample program  
```
$./run-example org.apache.spark.examples.SparkPi local
```
Then you get the output as 
Pi is roughly 3.14634. Spark is ready to fire

###Spark Interactive Shell
You can run Spark interactively through the Scala shell
```
$./spark-shell
```
```scala
scala> val textFile = sc.textFile("README.md")
scala> textFile.count()
```
Using this you can check your code line by line.
###Accessing Hadoop Filesystems
You can run Spark along with your existing Hadoop Cluster. To access Hadoop data from Spark, just use a hdfs://URL.  Run a word count example in the shell, taking input from hdfs and writing output back to hdfs. For using hdfs you must rebuild Spark against the same version that your hdfs cluster uses. From the Spark download page, you may download a prebuilt package.
If you have already the build source package, rebuild it against the hadoop version as follows
```
$sbt/sbt clean
```
You can change this by setting the SPARK_HADOOP_VERSION variable. Here uses Hadoop 2.0.0-cdh4.3.0
```
$SPARK_HADOOP_VERSION=2.0.0-mr1-cdh4.3.0 sbt/sbt assembly
```

After successfully build. You can read  and write data into cdh4.3.0 clusters.
```
$./spark-shell
```
```scala
scala> var file = sc.textFile("hdfs://IP:8020/path/to/textfile.txt")
scala>  file.flatMap(line => line.split(",")).map(word => (word, 1)).reduceByKey(_+_)
scala> count.saveAsTextFile("hdfs://IP:8020/path/to/ouput")
```
You may find more [here](http://spark.apache.org/docs/latest/quick-start.html)
