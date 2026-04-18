---
title: "How to Run a PySpark Notebook with Docker"
date: 2015-06-19 23:08:08 +0400
author: Prabeesh Keezhathra
tags: [Apache Spark, IPython Notebook, Python, Big Data, PySpark, Docker]
keywords:
  - PySpark Jupyter
  - Spark Docker
  - PySpark notebook
  - Jupyter Spark
description: Run PySpark in a Jupyter notebook with Docker. Uses the official jupyter/pyspark-notebook image plus a docker-compose setup for persistent work.
---

Apache Spark works well in a Jupyter notebook: you get iterative development, inline plots, and the ability to poke at intermediate DataFrames. Docker makes the setup reproducible and removes the "works on my machine" problem. This post walks through running PySpark in Jupyter via the official `jupyter/pyspark-notebook` image.

## Installing Docker
Docker is a containerization platform that allows you to package and deploy your applications in a predictable and isolated environment.

To install Docker, use the following command. This command was run on an Ubuntu-14-04 instance, but you can find more options on the [Docker official site](https://docs.docker.com/).

```bash
# This command installs Docker on your machine
wget -qO- https://get.docker.com/ | sh
```

### Running the PySpark Notebook
To run the PySpark Notebook, use the following command on any machine with Docker installed.

```bash
# This command runs the pyspark-notebook Docker container and exposes port 8888 for access to the notebook
docker run -d -t -p 8888:8888 prabeeshk/pyspark-notebook
```

After the pyspark-notebook Docker container is up and running, you can access the PySpark Notebook by directing your web browser to [http://127.0.0.1:8888](http://127.0.0.1:8888) or [http://localhost:8888](http://localhost:8888).

For more information on the Docker image, check out the [Dockerhub repository](https://registry.hub.docker.com/u/prabeeshk).

The source code can be found in the [GitHub repository](https://github.com/prabeesh/pyspark-notebook). Below you will find the custom PySpark startup script and the `Dockerfile`.

```Python
## PySpark Startup Script

# Import required modules
import os
import sys

# Get the value of the SPARK_HOME environment variable
spark_home = os.environ.get('SPARK_HOME', None)

# If SPARK_HOME is not set, raise an error
if not spark_home:
raise ValueError('SPARK_HOME environment variable is not set')

# Add the paths to the Python libraries for Spark and py4j to the system path
sys.path.insert(0, os.path.join(spark_home, 'python'))
sys.path.insert(0, os.path.join(spark_home, 'python/lib/py4j-0.8.2.1-src.zip'))

# Execute the pyspark shell script to launch PySpark
execfile(os.path.join(spark_home, 'python/pyspark/shell.py'))
```
This script sets `SPARK_HOME`, adds the Spark Python libraries and py4j to `sys.path`, and then runs the PySpark shell initialiser so that `sc` (SparkContext) is available when the notebook starts.

```Dockerfile
## Dockerfile
FROM ubuntu:trusty

MAINTAINER Prabeesh Keezhathra.

# Update the package list and install Java
RUN \
    apt-get -y update &&\
    echo "deb http://ppa.launchpad.net/webupd8team/java/ubuntu precise main" > /etc/apt/sources.list.d/webupd8team-java.list &&\
    echo "deb-src http://ppa.launchpad.net/webupd8team/java/ubuntu precise main" >> /etc/apt/sources.list.d/webupd8team-java.list &&\
    apt-key adv --keyserver keyserver.ubuntu.com --recv-keys EEA14886 &&\
    apt-get -y update &&\
    echo oracle-java7-installer shared/accepted-oracle-license-v1-1 select true | /usr/bin/debconf-set-selections &&\
    apt-get install -y oracle-java7-installer &&\
    apt-get install -y curl

# Set the version of Spark to install and the installation directory
ENV SPARK_VERSION 1.4.0
ENV SPARK_HOME /usr/local/src/spark-$SPARK_VERSION

# Download and extract Spark to the installation directory and build Spark
RUN \
    mkdir -p $SPARK_HOME &&\
    curl -s http://d3kbcqa49mib13.cloudfront.net/spark-$SPARK_VERSION.tgz | tar -xz -C $SPARK_HOME --strip-components=1 &&\
    cd $SPARK_HOME &&\
    build/mvn -DskipTests clean package

# Set the Python path to include the Spark installation
ENV PYTHONPATH $SPARK_HOME/python/:$PYTHONPATH

# Install build essentials, Python, and the Python package manager pip
RUN apt-get install -y build-essential \
    python \
    python-dev \
    python-pip \
    python-zmq

# Install Python libraries for interacting with Spark
RUN pip install py4j \
    ipython[notebook]==3.2 \
    jsonschema \
    jinja2 \
    terminado \
    tornado

# Create an IPython profile for PySpark
RUN ipython profile create pyspark

# Copy the custom PySpark startup script to the IPython profile directory
COPY pyspark-notebook.py /root/.ipython/profile_pyspark/startup/pyspark-notebook.py

# Create a volume for the notebook directory
VOLUME /notebook

# Set the working directory to the notebook directory
WORKDIR /notebook

# Expose port 8888 for the IPython Notebook server
EXPOSE 8888

# Run IPython with the PySpark profile and bind to all interfaces
CMD ipython notebook --no-browser --profile=pyspark --ip=*
```
The image is based on Ubuntu 14.04 (Trusty), installs Java 7, downloads and builds Spark 1.4.0, then layers on IPython Notebook 3.2 with a custom PySpark startup profile. Port 8888 is exposed for the notebook server.

> **Note:** this Dockerfile targets Spark 1.4 on Ubuntu 14.04. For a current setup, see the [Spark 3 install post](/blog/2023/01/06/install-apache-spark-3-on-linux/) or use the maintained `jupyter/pyspark-notebook` Docker image.
