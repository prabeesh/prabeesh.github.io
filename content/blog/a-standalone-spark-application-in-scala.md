---
title: "Standalone Spark Application in Scala: Twitter Streaming Example"
date: 2014-04-01T22:56:00+05:30
author: Prabeesh Keezhathra
tags:
  - Apache Spark
  - SBT
  - Scala
  - Spark Streaming
keywords:
  - Spark Streaming Scala
  - sbt Spark project
  - Eclipse Spark
  - Twitter streaming example
description: Build a standalone Spark Streaming app in Scala that surfaces popular Twitter hashtags, packaged with sbt and developed in the Eclipse IDE.
---
This post walks through building a Spark Streaming application in Scala that extracts popular hashtags from the Twitter firehose, packaged with sbt, and runnable from the Eclipse IDE via the sbteclipse plugin.

## Building a Spark application using SBT
A standalone Scala application built against the Apache Spark API and packaged with sbt (Simple Build Tool).

For  creating a stand alone app take the twitter popular tag [example](https://github.com/apache/spark/blob/branch-0.9/examples/src/main/scala/org/apache/spark/streaming/examples/TwitterPopularTags.scala)

This program calculates popular hashtags (popular topics) over sliding 10 and 60 second windows from a Twitter stream. The stream is instantiated with credentials and optionally filters supplied by the command line arguments.

But here modified the code for talking twitter authentication credentials through command line argument. So it needs to give the arguments as <!--more--> `master` `consumerKey` `consumerSecret` `accessToken` `accessTokenSecret` `filters`.
```Scala
// Twitter Authentication credentials  
System.setProperty("twitter4j.oauth.consumerKey", args(1))  
System.setProperty("twitter4j.oauth.consumerSecret", args(2))  
System.setProperty("twitter4j.oauth.accessToken", args(3))  
System.setProperty("twitter4j.oauth.accessTokenSecret", args(4))  
``` 
If you want to read Twitter authentication credentials from a file, see this [TwitterUtils example](https://github.com/pwendell/spark-twitter-collection/blob/master/TwitterUtils.scala).

The sbt configuration file. For more detail about sbt, see the [sbt setup guide](http://www.scala-sbt.org/release/docs/Getting-Started/Setup.html).
```Scala
name := "TwitterPopularTags" 

version := "0.1.0" 

scalaVersion := "2.10.3" 

libraryDependencies ++= Seq("org.apache.spark" %% 
"spark-core" % "0.9.0-incubating", 
"org.apache.spark" %% "spark-streaming" % "0.9.0-incubating", 
"org.apache.spark" %% "spark-streaming-twitter" % "0.9.0-incubating")

resolvers += "Akka Repository" at "http://repo.akka.io/releases/"
```
You can find [the project at Github](https://github.com/prabeesh/SparkTwitterAnalysis/tree/0.1.0)

## Spark programming in Eclipse
Using sbt eclipse plugin, sbt project can run on Eclipse IDE.  For more details find [SBT Eclipse](https://github.com/typesafehub/sbteclipse)
```Scala
addSbtPlugin("com.typesafe.sbteclipse" % "sbteclipse-plugin" % "2.1.0")
```
then run from the root folder of the project
```
sbt/sbt eclipse
```
This command  creates a project compatible with Eclipse. Upon opening the eclipse IDE this project can now be imported and the executed with the spark.

To avoid generating Eclipse source entries for the java directories and put all libs in `lib_managed` (so you can distribute Eclipse project files), add this to `build.sbt`:
```Scala
retrieveManaged := true

EclipseKeys.relativizeLibs := true

(unmanagedSourceDirectories in Compile) <<= (scalaSource in Compile)(Seq(_))

(unmanagedSourceDirectories in Test) <<= (scalaSource in Test)(Seq(_))  
```

You can find [the sbt eclipse project here](https://github.com/prabeesh/SparkTwitterAnalysis/tree/0.2.0)

Once you have the application running, see the [Uber JAR post](/blog/2014/04/01/creating-uber-jar-for-spark-project-using-sbt-assembly/) for packaging it into a single deployable JAR with sbt-assembly.
