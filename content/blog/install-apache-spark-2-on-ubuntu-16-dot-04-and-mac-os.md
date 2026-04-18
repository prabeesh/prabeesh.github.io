---
title: "Install Apache Spark 2 on Ubuntu 16.04 and macOS"
date: 2016-12-07 11:45:18 +0400
author: Prabeesh Keezhathra
tags: [Apache Spark, Big Data, Ubuntu, macOS, Installation Guide, Maven, Java]
keywords:
  - Apache Spark 2 installation
  - Spark Ubuntu 16.04 setup
  - Spark macOS installation
  - Maven Spark build
  - Hadoop Spark integration
description: Install Apache Spark 2.0 on Ubuntu 16.04 and macOS. Covers Java setup, the Maven build, Hadoop integration, and environment configuration.
---
Earlier posts covered [Spark 0.8.0 on Ubuntu 12.04](/blog/2013/11/26/installing-apache-spark-on-ubuntu-1204/) and [Spark 1.1.0 on Ubuntu 14.04](/blog/2014/10/31/install-apache-spark-on-ubuntu-14-dot-04/). This one walks through Spark 2.0.2 on Ubuntu 16.04 and Mac OS X Sierra.
<!--more-->

Java must be installed first. On Ubuntu:
```
$ sudo apt-add-repository ppa:webupd8team/java
$ sudo apt-get update
$ sudo apt-get install oracle-java7-installer
```

On macOS, grab `jdk-7u79-macosx-x64.dmg` from the [Oracle download page](http://www.oracle.com/technetwork/java/javase/downloads/jdk7-downloads-1880260.html), accept the license, and double-click the dmg to install.

Verify:
```
$ java -version
java version "1.7.0_72"
Java(TM) SE Runtime Environment (build 1.7.0_72-b14)
Java HotSpot(TM) 64-Bit Server VM (build 24.72-b04, mixed mode)
```

The build depends on git. On Ubuntu:
```
sudo apt-get install git
```
On macOS:
```
brew install git
```

Download and untar the Spark 2 distribution, for example into `/usr/local/share/spark`:
```
$ mkdir /usr/local/share/spark
$ curl http://d3kbcqa49mib13.cloudfront.net/spark-2.0.2.tgz | tar xvz -C /usr/local/share/spark
```

### Build

Maven is bundled with Spark, so you can build in-place:
```
$ cd /usr/local/share/spark/spark-2.0.2
$ ./build/mvn -DskipTests clean package
```

The build takes a while. Once it finishes, run a sample job to confirm:
```
$ ./bin/run-example SparkPi 10
```

You'll see `Pi is roughly 3.14634` in the output.

To build against a specific Hadoop version:
```
./build/mvn -Pyarn -Phadoop-2.7 -Dhadoop.version=2.7.0 -DskipTests clean package
```

See the [official building docs](http://spark.apache.org/docs/latest/building-spark.html#specifying-the-hadoop-version) for more options. For the older Spark 1 install walkthrough, see the [Ubuntu 14.04 post](/blog/2014/10/31/install-apache-spark-on-ubuntu-14-dot-04/).

## Environment variables

After a successful build, make sure the shell knows where to find the binaries. Add these to `~/.bashrc`:

```bash
export SPARK_HOME=/usr/local/share/spark/spark-2.0.2
export PATH=$PATH:$SPARK_HOME/bin:$SPARK_HOME/sbin
```

Then reload with `source ~/.bashrc` and confirm with `spark-shell --version`.

## Next steps

- [Performance tuning](/blog/2023/01/06/performance-tuning-on-apache-spark/) once you have jobs running
- The [Spark 3.5 install guide](/blog/2013/11/26/installing-apache-spark-on-ubuntu-1204/) if you want the latest version
