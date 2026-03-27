---
title: "Complete Guide: Install Apache Spark on Linux (Ubuntu, CentOS) - 2024 Updated"
date: 2013-11-26T12:24:00+05:30
tags: [Apache Spark, Big Data, Installation Guide, Linux, Ubuntu]
keywords: install Apache Spark 3.5, Spark installation Linux, Apache Spark Ubuntu 22.04, Spark setup guide 2024, Spark cluster installation, Scala Spark installation, PySpark installation
description: Complete step-by-step guide to install Apache Spark 3.5 on Linux systems including Ubuntu 22.04, CentOS, and other distributions. Learn standalone installation, cluster configuration, Python/Scala setup, and essential optimization for production environments.
---

Apache Spark has evolved dramatically since its early releases, becoming the de facto standard for large-scale data processing and analytics. This comprehensive guide covers installing the latest Apache Spark 3.5+ on modern Linux distributions with best practices for both development and production environments.

**Update Notice**: This guide covers modern Apache Spark 3.5+ installation. For historical reference, our previous guides covered [Apache Spark 1.0 installation](/blog/2014/10/31/install-apache-spark-on-ubuntu-14-dot-04/) and [Apache Spark 2.x setup](/blog/2016/12/07/install-apache-spark-2-on-ubuntu-16-dot-04-and-mac-os/).

Apache Spark is an open-source, distributed computing framework designed for fast processing of large datasets across clusters. Originally developed at UC Berkeley's AMPLab, Spark provides unified analytics capabilities including batch processing, real-time streaming, machine learning, and graph processing with clean APIs in Scala, Java, Python, and R.

## Prerequisites and System Requirements

### Minimum System Requirements
- **Java**: OpenJDK 8, 11, or 17 (Java 17 recommended for Spark 3.5+)
- **Python**: 3.8+ (for PySpark usage)
- **Memory**: 4GB RAM minimum, 8GB+ recommended
- **Storage**: 10GB free space for installation and logs
- **OS**: Ubuntu 20.04+, CentOS 7+, or equivalent Linux distribution

### Pre-Installation Setup

**Install Java (OpenJDK 17 recommended)**:
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install openjdk-17-jdk

# CentOS/RHEL
sudo yum install java-17-openjdk-devel

# Verify installation
java -version
javac -version
```

**Set JAVA_HOME environment variable**:
```bash
# Add to ~/.bashrc or ~/.profile
echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64' >> ~/.bashrc
echo 'export PATH=$PATH:$JAVA_HOME/bin' >> ~/.bashrc
source ~/.bashrc

# Verify
echo $JAVA_HOME
```

**Install Python and essential packages** (for PySpark):
```bash
# Ubuntu/Debian
sudo apt install python3 python3-pip python3-dev

# CentOS/RHEL  
sudo yum install python3 python3-pip python3-devel

# Install essential Python packages
pip3 install py4j pandas numpy matplotlib
```

## Apache Spark Installation Methods

### Method 1: Binary Distribution (Recommended for Most Users)

**Download the latest Spark distribution**:
```bash
# Navigate to your preferred installation directory
cd /opt

# Download Spark 3.5+ (check spark.apache.org for latest version)
sudo wget https://archive.apache.org/dist/spark/spark-3.5.0/spark-3.5.0-bin-hadoop3.tgz

# Alternative: Download pre-built for specific Hadoop version
# sudo wget https://archive.apache.org/dist/spark/spark-3.5.0/spark-3.5.0-bin-hadoop3-scala2.13.tgz
```

**Extract and setup Spark**:
```bash
# Extract the archive
sudo tar -xzf spark-3.5.0-bin-hadoop3.tgz

# Create symbolic link for easier management
sudo ln -sf spark-3.5.0-bin-hadoop3 spark

# Set proper permissions
sudo chown -R $USER:$USER /opt/spark-3.5.0-bin-hadoop3
```

**Configure environment variables**:
```bash
# Add to ~/.bashrc
echo 'export SPARK_HOME=/opt/spark' >> ~/.bashrc
echo 'export PATH=$PATH:$SPARK_HOME/bin:$SPARK_HOME/sbin' >> ~/.bashrc
echo 'export PYSPARK_PYTHON=python3' >> ~/.bashrc
echo 'export PYSPARK_DRIVER_PYTHON=python3' >> ~/.bashrc

# Apply changes
source ~/.bashrc
```

### Method 2: Building from Source (Advanced Users)

**For users needing specific configurations or latest development features**:
```bash
# Install build dependencies
sudo apt install git maven scala

# Clone Spark repository
git clone https://github.com/apache/spark.git
cd spark

# Build with specific Hadoop version
./build/mvn -DskipTests clean package -Phadoop-3.3 -Dhadoop.version=3.3.4

# This process takes 30-60 minutes depending on your system
```

## Spark Configuration and Optimization

### Basic Configuration

**Create Spark configuration directory**:
```bash
cd $SPARK_HOME/conf
cp spark-defaults.conf.template spark-defaults.conf
cp spark-env.sh.template spark-env.sh
```

**Essential spark-defaults.conf settings**:
```bash
# Edit spark-defaults.conf
nano spark-defaults.conf

# Add these essential configurations:
spark.master                     spark://localhost:7077
spark.eventLog.enabled           true
spark.eventLog.dir               /tmp/spark-events
spark.history.fs.logDirectory    /tmp/spark-events
spark.sql.warehouse.dir          /tmp/spark-warehouse

# Performance optimizations
spark.executor.memory            2g
spark.executor.cores             2
spark.executor.instances         2
spark.driver.memory              1g
spark.driver.maxResultSize       1g

# Enable dynamic allocation
spark.dynamicAllocation.enabled  true
spark.dynamicAllocation.minExecutors    1
spark.dynamicAllocation.maxExecutors    4

# Kryo serialization for better performance
spark.serializer                 org.apache.spark.serializer.KryoSerializer
```

**Configure spark-env.sh**:
```bash
# Edit spark-env.sh
nano spark-env.sh

# Add essential environment variables:
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export SPARK_MASTER_HOST=localhost
export SPARK_WORKER_MEMORY=2g
export SPARK_WORKER_CORES=2
export SPARK_WORKER_INSTANCES=1
```

## Testing Your Spark Installation

### Basic Functionality Tests

**Test 1: Spark Shell (Scala)**
```bash
# Start Spark shell
spark-shell

# Run in Spark shell:
scala> val data = 1 to 10000
scala> val distData = sc.parallelize(data)
scala> distData.filter(_ < 10).collect()
scala> :quit
```

**Test 2: PySpark Shell**
```bash
# Start PySpark shell
pyspark

# Run in PySpark:
>>> data = range(1, 10000)
>>> distData = sc.parallelize(data)
>>> distData.filter(lambda x: x < 10).collect()
>>> exit()
```

**Test 3: Submit Application**
```bash
# Run the classic Pi estimation example
spark-submit \
    --class org.apache.spark.examples.SparkPi \
    --master local[2] \
    $SPARK_HOME/examples/jars/spark-examples_2.12-3.5.0.jar \
    10
```

Expected output: `Pi is roughly 3.141592653589793`

### Performance Validation Tests

**Test Spark with different configurations**:
```bash
# Test with local cluster
spark-submit \
    --class org.apache.spark.examples.SparkPi \
    --master local[4] \
    --driver-memory 2g \
    --executor-memory 1g \
    $SPARK_HOME/examples/jars/spark-examples_2.12-3.5.0.jar \
    100
```

## Cluster Setup (Optional but Recommended)

### Standalone Cluster Configuration

**Start Spark Master**:
```bash
# Start master node
start-master.sh

# Verify master is running
# Open browser to http://localhost:8080
```

**Start Spark Worker(s)**:
```bash
# Start worker node
start-worker.sh spark://localhost:7077

# For multiple workers on same machine
start-worker.sh -c 1 -m 1g spark://localhost:7077
start-worker.sh -c 1 -m 1g spark://localhost:7077
```

**Test cluster deployment**:
```bash
# Submit job to cluster
spark-submit \
    --class org.apache.spark.examples.SparkPi \
    --master spark://localhost:7077 \
    --executor-memory 1g \
    --total-executor-cores 2 \
    $SPARK_HOME/examples/jars/spark-examples_2.12-3.5.0.jar \
    100
```

## Hadoop Integration

### Working with HDFS

**For existing Hadoop clusters**:
```bash
# Ensure Spark is built with correct Hadoop version
# Check your Hadoop version
hadoop version

# Download Spark pre-built for your Hadoop version
# Example for Hadoop 3.3:
wget https://archive.apache.org/dist/spark/spark-3.5.0/spark-3.5.0-bin-hadoop3.tgz
```

**Test HDFS integration**:
```bash
# Start spark-shell with HDFS access
spark-shell

# Read from HDFS
scala> val textFile = sc.textFile("hdfs://namenode:9000/path/to/input.txt")
scala> val wordCounts = textFile.flatMap(line => line.split(" ")).map(word => (word, 1)).reduceByKey(_ + _)
scala> wordCounts.saveAsTextFile("hdfs://namenode:9000/path/to/output")
```

## Development Environment Setup

### IDE Integration

**IntelliJ IDEA Setup**:
1. Install Scala plugin
2. Create new SBT project
3. Add Spark dependencies to build.sbt:

```scala
name := "SparkApplication"
version := "0.1"
scalaVersion := "2.12.17"

libraryDependencies ++= Seq(
  "org.apache.spark" %% "spark-core" % "3.5.0",
  "org.apache.spark" %% "spark-sql" % "3.5.0",
  "org.apache.spark" %% "spark-mllib" % "3.5.0"
)
```

**VS Code Setup for PySpark**:
```bash
# Install Python extension
# Install Pylint for Python linting
pip3 install pylint

# Create virtual environment for Spark projects
python3 -m venv spark-env
source spark-env/bin/activate
pip install pyspark pandas numpy jupyter
```

## Production Deployment Considerations

### Security Configuration
```bash
# Enable authentication
spark.authenticate true
spark.authenticate.secret yourSecretKey

# SSL configuration
spark.ssl.enabled true
spark.ssl.keyStore /path/to/keystore.jks
spark.ssl.keyStorePassword yourKeystorePassword
```

### Monitoring and Logging
```bash
# Enable history server
start-history-server.sh

# Access history UI at http://localhost:18080

# Configure log levels
cp log4j.properties.template log4j.properties
# Edit log4j.properties for appropriate log levels
```

### Resource Management
```bash
# For YARN integration
export HADOOP_CONF_DIR=/path/to/hadoop/conf
spark-submit --master yarn --deploy-mode cluster your-application.jar

# For Kubernetes deployment
spark-submit \
    --master k8s://https://kubernetes-master-url:443 \
    --deploy-mode cluster \
    --conf spark.kubernetes.container.image=spark-py:latest \
    your-application.py
```

## Troubleshooting Common Issues

### Memory Issues
```bash
# Increase driver memory
spark-submit --driver-memory 4g your-app.jar

# Configure executor memory
spark-submit --executor-memory 2g your-app.jar
```

### Java Version Conflicts
```bash
# Ensure consistent Java version
update-alternatives --config java
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
```

### Network Binding Issues
```bash
# Configure specific network interface
export SPARK_MASTER_HOST=192.168.1.100
export SPARK_LOCAL_IP=192.168.1.100
```

## Next Steps and Advanced Topics

Now that you have Spark installed and configured, explore these advanced topics:

1. **Performance Tuning**: Learn advanced [Spark performance optimization](/blog/2023/01/06/performance-tuning-on-apache-spark/) techniques
2. **Application Development**: Create [standalone Spark applications in Scala](/blog/2014/04/01/a-standalone-spark-application-in-scala/)
3. **Container Deployment**: Set up [PySpark with Docker](/blog/2015/06/19/pyspark-notebook-with-docker/) for reproducible environments
4. **Streaming Applications**: Build real-time data processing pipelines
5. **Machine Learning**: Implement MLlib algorithms for production ML workflows

## Maintenance and Updates

**Regular maintenance tasks**:
```bash
# Update Spark (backup configurations first)
# Download new version and update SPARK_HOME

# Clean up logs periodically
find /tmp/spark-events -type f -mtime +30 -delete

# Monitor cluster health
# Check master UI: http://localhost:8080
# Check history server: http://localhost:18080
```

This comprehensive installation guide provides a solid foundation for Apache Spark development and deployment. Whether you're building data analytics pipelines, machine learning models, or real-time streaming applications, this setup will serve as your reliable starting point.

For more advanced Spark tutorials and best practices, explore our complete [Apache Spark tutorial series](#) covering performance optimization, application development, and production deployment strategies.
