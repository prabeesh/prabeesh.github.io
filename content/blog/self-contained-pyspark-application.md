---
title: "Building Self-Contained PySpark Applications"
date: 2015-04-07 21:05:30 +0530
author: Prabeesh Keezhathra
tags:
  - Apache Spark
  - PySpark
  - Python
  - spark-submit
keywords:
  - standalone PySpark
  - spark-submit Python
  - self-contained PySpark
  - PySpark deployment
description: Go from the `pyspark` REPL to a self-contained Python application you can ship with `spark-submit`. Covers project layout, dependencies, and submission.
---
The [earlier install post](/blog/2014/10/31/install-apache-spark-on-ubuntu-14-dot-04/) covered the Scala interactive shell. This one shows how to do the same in Python, then how to turn an experiment into a standalone application you can run with `spark-submit`.
```
./bin/pyspark
```  
Now you can enjoy Spark using Python interactive shell.

This shell might be sufficient for experimentations and developments. However, for production level, we should use a standalone application. <!--more--> I talked about a stand alone Spark application in Scala in one of my previous [post](/blog/2014/04/01/a-standalone-spark-application-in-scala/). Here comes the same written in Python (you can find more about it in [Spark official site](https://spark.apache.org/docs/latest/quick-start.html#self-contained-applications)), known as a self-contained PySpark application.

First, [refer this post](/blog/2014/10/31/install-apache-spark-on-ubuntu-14-dot-04/) to build Spark using sbt assembly. Add Pyspark lib in system Python path as follows:
```
cd ~
vi .bashrc
```
Add the following exports in end of bashrc file 
```
export SPARK_HOME=<path to Spark home>
export PYTHONPATH=$SPARK_HOME/python/:$PYTHONPATH
export PYTHONPATH=$SPARK_HOME/python/lib/py4j-0.8-src.zip:$PYTHONPATH
```
PySpark depends on the `py4j` Python package. It helps Python interpreter to dynamically access the Spark object from the JVM.

Don't forget to export the SPARK_HOME. Restart `BASH` once it is done.
```
. .bashrc
```
PySpark should be available in system path by now. After writing the Python code, one can simply run the code using `python` command then it runs in local Spark instance with default configurations.
```
python <python_file.py>
```
It is better to use the spark submit script if you want to pass the configuration values at runtime. 
```
./bin/spark-submit --master local[*] <python_file.py>
``` 
For more details about spark submit [refer here](https://spark.apache.org/docs/latest/configuration.html). From the site we can observe that the configuration values can be passed at run time. It can also be changed in the conf/spark-defaults.conf file. After configuring the spark config file the changes also get reflected while running pyspark applications using simple `python` command.

The reason for why there is no `pip install` for pyspark can be found in this [jira ticket](https://issues.apache.org/jira/browse/SPARK-1267).

If you are a fan of ipython, then you have the option to run PySpark ipython notebook. Refer this [blog post](http://blog.cloudera.com/blog/2014/08/how-to-use-ipython-notebook-with-apache-spark/) for more detail.    

