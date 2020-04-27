---
title: "pyspark notebook with docker"
date: 2015-06-19 23:08:08 +0400
tags: [Apache Spark, Ipython Notebook, Python, Big Data, PySpark]
keywords: pyspark ipython notebook, spark ipython, spark python notebook, Spark with docker, docker ipython spark notebook, spark ipython notebook, docker pyspark, jupyter notebook, pyspark jupyter, +pyspark +jupyter, jupyter notebook spark, spark notebook, apache spark notebook
description: This is post describing Spark ipython notebook to run using docker. 
---
#### Install Docker
Using the following command one can install docker. I have done the same using Ubuntu-14-04 instance. For richer options refer the [docker official site](https://docs.docker.com/) 
```
 wget -qO- https://get.docker.com/ | sh
```
Now run the following command from any machine on which docker is installed.
```
docker run -d -t -p 8888:8888 prabeeshk/pyspark-notebook
```
After successfully running the pyspark-notebook docker container, access pyspark ipython notebook by <!--more--> directing the web browser to [http://127.0.0.1:8888](http://127.0.0.1:8888) or [http://localhost:8888](http://localhost:8888). Enjoy the Spark with ipython notebook.

For docker image details refer  [dockerhub repository](https://registry.hub.docker.com/u/prabeeshk/pyspark-notebook/)

Find the source code in [github repository](https://github.com/prabeesh/pyspark-notebook)
