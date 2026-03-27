---
title: "Apache Spark Streaming for Real-Time Analytics: Production Implementation Guide"
date: 2024-02-15T14:30:00+01:00
draft: false
tags: [Apache Spark Streaming, real-time analytics, production deployment, stream processing, Kafka integration, data engineering, performance optimization, monitoring, fault tolerance]
keywords: Spark Streaming production, real-time data processing, Apache Spark streaming architecture, Kafka Spark integration, stream processing patterns, real-time analytics pipeline, Spark streaming performance tuning, fault-tolerant streaming
description: Build production-ready real-time analytics systems with Apache Spark Streaming. Master streaming architecture patterns, Kafka integration, checkpointing, monitoring, and performance optimization for scalable stream processing pipelines.
---

Real-time data processing has become essential for modern applications, from fraud detection to live dashboards. Apache Spark Streaming provides a powerful framework for building scalable, fault-tolerant streaming applications that process continuous data streams with the same APIs you use for batch processing.

This comprehensive guide builds upon our foundational [Apache Spark performance tuning](/blog/2023/01/06/performance-tuning-on-apache-spark/) concepts to cover production-ready streaming implementations that can handle millions of events per second with guaranteed delivery and exactly-once processing semantics.

## Understanding Spark Streaming Architecture

Apache Spark Streaming operates on a micro-batch architecture, where continuous data streams are divided into small batches processed using Spark's core engine. This approach provides the benefits of batch processing (fault tolerance, exactly-once semantics) with near real-time latency.

### Key Components

**DStream (Discretized Stream)**: The fundamental abstraction representing a continuous stream of data as a sequence of RDDs.

**Receivers**: Components that receive data from external sources and store it in Spark's memory for processing.

**Checkpointing**: Mechanism for storing stream metadata and RDD data to enable fault recovery.

**Output Operations**: Actions that send processed stream data to external systems.

### Streaming vs. Structured Streaming

While this guide focuses on DStream-based Spark Streaming, it's important to understand when to use each approach:

**Use DStream-based Streaming when**:
- Working with low-level stream processing requirements
- Need fine-grained control over stream processing logic
- Integrating with legacy systems that require DStream APIs

**Use Structured Streaming when**:
- Building new applications (recommended for new projects)
- Need SQL-like operations on streaming data
- Require end-to-end exactly-once guarantees out of the box

## Production Streaming Architecture Patterns

### Pattern 1: Lambda Architecture with Spark

```scala
import org.apache.spark.streaming._
import org.apache.spark.streaming.kafka010._
import org.apache.kafka.clients.consumer.ConsumerRecord
import org.apache.kafka.common.serialization.StringDeserializer
import org.apache.spark.sql.SparkSession
import org.apache.spark.streaming.dstream.InputDStream

/**
 * Production Lambda Architecture implementation
 * Processes real-time streams while maintaining batch views for accuracy
 */
object LambdaArchitectureStreaming {
  
  def main(args: Array[String]): Unit = {
    val spark = SparkSession.builder()
      .appName("ProductionLambdaStreaming")
      .config("spark.streaming.backpressure.enabled", "true")
      .config("spark.streaming.kafka.maxRatePerPartition", "1000")
      .config("spark.streaming.receiver.maxRate", "10000")
      .getOrCreate()

    val ssc = new StreamingContext(spark.sparkContext, Seconds(10))
    
    // Enable checkpointing for fault tolerance
    ssc.checkpoint("hdfs://namenode:9000/streaming/checkpoints")
    
    // Configure Kafka stream
    val kafkaParams = Map[String, Object](
      "bootstrap.servers" -> "broker1:9092,broker2:9092,broker3:9092",
      "key.deserializer" -> classOf[StringDeserializer],
      "value.deserializer" -> classOf[StringDeserializer],
      "group.id" -> "spark-streaming-lambda",
      "auto.offset.reset" -> "latest",
      "enable.auto.commit" -> (false: java.lang.Boolean)
    )

    val topics = Array("user-events", "transaction-events", "system-events")
    val stream = KafkaUtils.createDirectStream[String, String](
      ssc,
      PreferConsistentBrokers,
      Subscribe[String, String](topics, kafkaParams)
    )

    // Real-time processing layer (Speed Layer)
    val realTimeMetrics = processRealTimeEvents(stream)
    
    // Store real-time results
    realTimeMetrics.foreachRDD { rdd =>
      if (!rdd.isEmpty()) {
        // Store in fast-access storage (Redis, HBase)
        storeRealTimeResults(rdd)
        
        // Also append to batch storage for later batch processing
        storeToBatchLayer(rdd)
      }
    }

    ssc.start()
    ssc.awaitTermination()
  }

  def processRealTimeEvents(stream: InputDStream[ConsumerRecord[String, String]]) = {
    stream
      .map(record => parseEvent(record.value()))
      .filter(event => isValidEvent(event))
      .window(Minutes(5), Seconds(30)) // 5-minute sliding window, 30-second slide
      .map(event => (event.eventType, event.value))
      .reduceByKey(_ + _)
      .transform { rdd =>
        // Apply complex aggregations and enrichment
        enrichWithDimensions(rdd)
      }
  }

  def parseEvent(json: String): Event = {
    // Parse JSON event data
    // Implementation depends on your event schema
    Event.fromJson(json)
  }

  def isValidEvent(event: Event): Boolean = {
    // Implement validation logic
    event.timestamp > 0 && event.eventType.nonEmpty
  }

  def enrichWithDimensions(rdd: org.apache.spark.rdd.RDD[(String, Double)]) = {
    // Join with dimension tables for enrichment
    // This could involve broadcast variables for small dimensions
    rdd.map { case (eventType, value) =>
      val enrichedData = lookupDimension(eventType)
      (eventType, value, enrichedData)
    }
  }

  def storeRealTimeResults(rdd: org.apache.spark.rdd.RDD[_]): Unit = {
    // Store in Redis, HBase, or other fast-access storage
    rdd.foreachPartition { partition =>
      val connection = createRedisConnection()
      partition.foreach { record =>
        connection.set(s"realtime:${record._1}", record._2.toString)
      }
      connection.close()
    }
  }

  def storeToBatchLayer(rdd: org.apache.spark.rdd.RDD[_]): Unit = {
    // Append to HDFS, S3, or data lake for batch processing
    rdd.saveAsTextFile(s"hdfs://namenode:9000/batch-data/${System.currentTimeMillis()}")
  }
}

case class Event(eventType: String, value: Double, timestamp: Long, userId: String)

object Event {
  def fromJson(json: String): Event = {
    // JSON parsing implementation
    // Use Jackson, Gson, or similar library
    Event("sample", 1.0, System.currentTimeMillis(), "user1")
  }
}
```

### Pattern 2: Event Sourcing with Spark Streaming

```scala
import org.apache.spark.streaming._
import org.apache.spark.streaming.dstream.DStream

/**
 * Event Sourcing pattern implementation
 * Maintains complete event history while providing materialized views
 */
object EventSourcingStreaming {
  
  def setupEventSourcingPipeline(ssc: StreamingContext): Unit = {
    // Configure multiple input streams
    val eventStream = createKafkaEventStream(ssc)
    val commandStream = createCommandStream(ssc)
    
    // Process events to update materialized views
    val processedEvents = eventStream
      .map(parseEventRecord)
      .updateStateByKey(updateEventState _)
    
    // Generate materialized views
    val userProfileView = generateUserProfileView(processedEvents)
    val aggregateView = generateAggregateView(processedEvents)
    val analyticsView = generateAnalyticsView(processedEvents)
    
    // Persist materialized views
    persistMaterializedViews(userProfileView, aggregateView, analyticsView)
    
    // Handle commands for CQRS pattern
    processCommands(commandStream, processedEvents)
  }

  def updateEventState(values: Seq[Event], state: Option[EventState]): Option[EventState] = {
    val currentState = state.getOrElse(EventState.empty)
    val newState = values.foldLeft(currentState) { (state, event) =>
      event.eventType match {
        case "user_created" => state.handleUserCreated(event)
        case "user_updated" => state.handleUserUpdated(event)
        case "transaction" => state.handleTransaction(event)
        case "system_event" => state.handleSystemEvent(event)
        case _ => state // Unknown event type
      }
    }
    Some(newState)
  }

  def generateUserProfileView(eventStream: DStream[(String, Option[EventState])]): DStream[UserProfile] = {
    eventStream
      .filter(_._2.isDefined)
      .map { case (userId, stateOpt) =>
        val state = stateOpt.get
        UserProfile(
          userId = userId,
          totalTransactions = state.transactionCount,
          totalAmount = state.totalAmount,
          lastActivity = state.lastActivityTime,
          preferences = state.userPreferences
        )
      }
  }

  def generateAggregateView(eventStream: DStream[(String, Option[EventState])]): DStream[AggregateMetrics] = {
    eventStream
      .flatMap(_._2)
      .transform { rdd =>
        val totalUsers = rdd.count()
        val totalTransactions = rdd.map(_.transactionCount).sum()
        val totalAmount = rdd.map(_.totalAmount).sum()
        
        rdd.sparkContext.parallelize(Seq(
          AggregateMetrics(
            timestamp = System.currentTimeMillis(),
            totalUsers = totalUsers,
            totalTransactions = totalTransactions.toLong,
            totalAmount = totalAmount,
            avgTransactionSize = if (totalTransactions > 0) totalAmount / totalTransactions else 0.0
          )
        ))
      }
  }
}

case class EventState(
  transactionCount: Long,
  totalAmount: Double,
  lastActivityTime: Long,
  userPreferences: Map[String, String]
) {
  def handleUserCreated(event: Event): EventState = {
    this.copy(lastActivityTime = event.timestamp)
  }
  
  def handleUserUpdated(event: Event): EventState = {
    this.copy(
      lastActivityTime = event.timestamp,
      userPreferences = userPreferences ++ parsePreferences(event.data)
    )
  }
  
  def handleTransaction(event: Event): EventState = {
    this.copy(
      transactionCount = transactionCount + 1,
      totalAmount = totalAmount + event.value,
      lastActivityTime = event.timestamp
    )
  }
  
  def handleSystemEvent(event: Event): EventState = {
    this.copy(lastActivityTime = event.timestamp)
  }
}

object EventState {
  def empty: EventState = EventState(0, 0.0, 0L, Map.empty)
}

case class UserProfile(
  userId: String,
  totalTransactions: Long,
  totalAmount: Double,
  lastActivity: Long,
  preferences: Map[String, String]
)

case class AggregateMetrics(
  timestamp: Long,
  totalUsers: Long,
  totalTransactions: Long,
  totalAmount: Double,
  avgTransactionSize: Double
)
```

## Production Performance Optimization

### Advanced Configuration for High Throughput

```scala
object StreamingPerformanceOptimizations {
  
  def createOptimizedStreamingContext(): StreamingContext = {
    val spark = SparkSession.builder()
      .appName("HighThroughputStreaming")
      // Memory optimization
      .config("spark.sql.streaming.metricsEnabled", "true")
      .config("spark.streaming.backpressure.enabled", "true")
      .config("spark.streaming.backpressure.initialRate", "10000")
      .config("spark.streaming.receiver.maxRate", "50000")
      .config("spark.streaming.kafka.maxRatePerPartition", "5000")
      
      // Checkpoint optimization
      .config("spark.streaming.checkpointDir.cleaner.enabled", "true")
      .config("spark.streaming.checkpointDir.cleaner.intervalSecs", "300")
      
      // Serialization optimization
      .config("spark.serializer", "org.apache.spark.serializer.KryoSerializer")
      .config("spark.kryo.registrationRequired", "false")
      
      // Resource optimization
      .config("spark.executor.cores", "4")
      .config("spark.executor.memory", "8g")
      .config("spark.executor.memoryFraction", "0.8")
      .config("spark.streaming.unpersist", "true")
      
      // Network optimization
      .config("spark.network.timeout", "600s")
      .config("spark.streaming.kafka.consumer.poll.ms", "1000")
      
      .getOrCreate()

    val ssc = new StreamingContext(spark.sparkContext, Seconds(5))
    ssc.checkpoint("hdfs://namenode:9000/streaming/optimized-checkpoints")
    ssc
  }

  def optimizeStreamProcessing[T](dstream: DStream[T]): DStream[T] = {
    dstream
      .persist(StorageLevel.MEMORY_AND_DISK_SER_2) // Efficient serialized storage
      .transform { rdd =>
        // Coalesce small partitions to reduce task overhead
        val optimalPartitions = Math.max(rdd.sparkContext.defaultParallelism, 
                                        rdd.partitions.length / 2)
        rdd.coalesce(optimalPartitions)
      }
  }

  def implementBackpressureControl(ssc: StreamingContext): Unit = {
    // Custom rate controller for dynamic backpressure
    val rateController = new PIDRateController()
    
    ssc.addStreamingListener(new StreamingListener {
      override def onBatchCompleted(batchCompleted: StreamingListenerBatchCompleted): Unit = {
        val processingDelay = batchCompleted.batchInfo.processingDelay.getOrElse(0L)
        val batchDuration = ssc.graph.batchDuration.milliseconds
        
        // Adjust rate based on processing performance
        if (processingDelay > batchDuration * 0.8) {
          rateController.decreaseRate()
        } else if (processingDelay < batchDuration * 0.3) {
          rateController.increaseRate()
        }
      }
    })
  }
}

class PIDRateController(
  var currentRate: Double = 10000.0,
  kp: Double = 0.1,
  ki: Double = 0.01,
  kd: Double = 0.05
) {
  private var previousError: Double = 0.0
  private var integral: Double = 0.0
  
  def adjustRate(targetLatency: Double, actualLatency: Double): Double = {
    val error = targetLatency - actualLatency
    integral += error
    val derivative = error - previousError
    
    val adjustment = kp * error + ki * integral + kd * derivative
    currentRate = Math.max(100, Math.min(50000, currentRate + adjustment))
    
    previousError = error
    currentRate
  }
  
  def increaseRate(): Unit = currentRate = Math.min(50000, currentRate * 1.1)
  def decreaseRate(): Unit = currentRate = Math.max(100, currentRate * 0.9)
}
```

## Fault Tolerance and Recovery Patterns

### Robust Checkpointing Strategy

```scala
object FaultTolerancePatterns {
  
  def implementRobustCheckpointing(ssc: StreamingContext): Unit = {
    // Multi-level checkpointing for maximum reliability
    val primaryCheckpointDir = "hdfs://namenode:9000/streaming/checkpoints/primary"
    val secondaryCheckpointDir = "s3a://backup-bucket/streaming/checkpoints/secondary"
    
    ssc.checkpoint(primaryCheckpointDir)
    
    // Custom checkpoint management
    ssc.addStreamingListener(new StreamingListener {
      override def onBatchCompleted(batchCompleted: StreamingListenerBatchCompleted): Unit = {
        // Periodically backup checkpoints to secondary location
        if (batchCompleted.batchInfo.batchTime.milliseconds % 300000 == 0) {
          backupCheckpointToSecondary(primaryCheckpointDir, secondaryCheckpointDir)
        }
        
        // Clean up old checkpoint data
        cleanupOldCheckpoints(primaryCheckpointDir, hoursToKeep = 24)
      }
    })
  }

  def createFailsafeStreamingApp(): StreamingContext = {
    def createStreamingContext(): StreamingContext = {
      val ssc = new StreamingContext(SparkContext.getOrCreate(), Seconds(10))
      
      // Setup your streaming logic here
      val stream = createInputStream(ssc)
      val processedStream = processStream(stream)
      persistResults(processedStream)
      
      ssc
    }

    // Recover from checkpoint or create new context
    val checkpointDir = "hdfs://namenode:9000/streaming/checkpoints"
    val ssc = StreamingContext.getOrCreate(checkpointDir, createStreamingContext _)
    
    // Add custom exception handling
    ssc.sparkContext.setLocalProperty("spark.streaming.stopGracefullyOnShutdown", "true")
    
    ssc
  }

  def implementExactlyOnceProcessing[T](
    stream: DStream[T],
    processFunction: T => Unit,
    outputLocation: String
  ): Unit = {
    
    stream.foreachRDD { (rdd, time) =>
      val batchId = s"batch_${time.milliseconds}"
      
      // Check if batch already processed (idempotency)
      if (!isBatchProcessed(batchId)) {
        // Process the batch
        rdd.foreachPartition { partition =>
          val connection = createTransactionalConnection()
          try {
            connection.beginTransaction()
            
            partition.foreach(processFunction)
            
            // Mark batch as processed
            markBatchAsProcessed(batchId, connection)
            connection.commit()
            
          } catch {
            case ex: Exception =>
              connection.rollback()
              throw ex
          } finally {
            connection.close()
          }
        }
      } else {
        println(s"Batch $batchId already processed, skipping...")
      }
    }
  }
}
```

## Production Monitoring and Observability

### Comprehensive Monitoring Framework

```scala
import org.apache.spark.streaming.scheduler._
import io.prometheus.client._
import java.util.concurrent.atomic.AtomicLong

object StreamingMonitoring {
  
  // Prometheus metrics
  val batchProcessingTime = Gauge.build()
    .name("spark_streaming_batch_processing_seconds")
    .help("Time taken to process each batch")
    .register()
    
  val recordsProcessed = Counter.build()
    .name("spark_streaming_records_processed_total")
    .help("Total number of records processed")
    .register()
    
  val failedBatches = Counter.build()
    .name("spark_streaming_failed_batches_total")
    .help("Total number of failed batches")
    .register()
    
  val queuedBatches = Gauge.build()
    .name("spark_streaming_queued_batches")
    .help("Number of batches waiting to be processed")
    .register()

  def setupMonitoring(ssc: StreamingContext): Unit = {
    ssc.addStreamingListener(new StreamingListener {
      
      override def onBatchStarted(batchStarted: StreamingListenerBatchStarted): Unit = {
        val queueDelay = batchStarted.batchInfo.processingStartTime.map(
          _ - batchStarted.batchInfo.batchTime.milliseconds
        ).getOrElse(0L)
        
        queuedBatches.set(queueDelay / 1000.0)
        
        logBatchInfo("STARTED", batchStarted.batchInfo)
      }
      
      override def onBatchCompleted(batchCompleted: StreamingListenerBatchCompleted): Unit = {
        val batchInfo = batchCompleted.batchInfo
        val processingTime = batchInfo.processingDelay.getOrElse(0L)
        val numRecords = batchInfo.numRecords
        
        batchProcessingTime.set(processingTime / 1000.0)
        recordsProcessed.inc(numRecords)
        
        // Check for performance degradation
        val batchDuration = ssc.graph.batchDuration.milliseconds
        if (processingTime > batchDuration * 1.5) {
          alertSlowProcessing(batchInfo, processingTime, batchDuration)
        }
        
        logBatchInfo("COMPLETED", batchInfo)
      }
      
      override def onBatchSubmitted(batchSubmitted: StreamingListenerBatchSubmitted): Unit = {
        logBatchInfo("SUBMITTED", batchSubmitted.batchInfo)
      }
      
      override def onReceiverError(receiverError: StreamingListenerReceiverError): Unit = {
        failedBatches.inc()
        logError(s"Receiver error: ${receiverError.receiverInfo.name}", 
                receiverError.receiverError)
        
        // Send alert for receiver failures
        sendReceiverAlert(receiverError)
      }
    })
    
    // Start metrics server
    startMetricsServer(8080)
  }

  def logBatchInfo(status: String, batchInfo: BatchInfo): Unit = {
    val processingDelay = batchInfo.processingDelay.getOrElse(0L)
    val schedulingDelay = batchInfo.schedulingDelay.getOrElse(0L)
    val totalDelay = batchInfo.totalDelay.getOrElse(0L)
    
    println(s"""
      |Batch $status:
      |  Time: ${batchInfo.batchTime}
      |  Records: ${batchInfo.numRecords}
      |  Processing Delay: ${processingDelay}ms
      |  Scheduling Delay: ${schedulingDelay}ms
      |  Total Delay: ${totalDelay}ms
      |""".stripMargin)
  }

  def createHealthcheckEndpoint(ssc: StreamingContext): Unit = {
    // Simple HTTP endpoint for health checks
    val healthStatus = new AtomicLong(System.currentTimeMillis())
    
    ssc.addStreamingListener(new StreamingListener {
      override def onBatchCompleted(batchCompleted: StreamingListenerBatchCompleted): Unit = {
        healthStatus.set(System.currentTimeMillis())
      }
    })
    
    // In production, implement proper HTTP server (Akka HTTP, etc.)
    // For now, write status to file system
    ssc.sparkContext.parallelize(Seq(1), 1).foreachRDD { _ =>
      val statusFile = "/tmp/streaming_health_status"
      val currentTime = System.currentTimeMillis()
      val lastUpdate = healthStatus.get()
      
      val status = if (currentTime - lastUpdate < 60000) "HEALTHY" else "UNHEALTHY"
      // Write status to file
      scala.tools.nsc.io.File(statusFile).writeAll(
        s"""{"status": "$status", "last_update": $lastUpdate, "current_time": $currentTime}"""
      )
    }
  }
}
```

## Real-World Deployment Scenarios

### Scenario 1: Financial Transaction Processing

```scala
object FinancialTransactionStreaming {
  
  def setupFraudDetectionPipeline(ssc: StreamingContext): Unit = {
    val transactionStream = createKafkaTransactionStream(ssc)
    
    // Real-time fraud detection
    val fraudDetection = transactionStream
      .map(parseTransaction)
      .filter(_.amount > 0) // Valid transactions only
      .transform(rdd => enrichWithUserProfile(rdd))
      .transform(rdd => enrichWithMerchantData(rdd))
      .map(applyFraudRules)
      .filter(_.riskScore > 0.7) // High-risk transactions only
    
    // Store suspicious transactions
    fraudDetection.foreachRDD { rdd =>
      if (!rdd.isEmpty()) {
        // Store in real-time alert system
        rdd.foreachPartition { partition =>
          val alertService = createAlertService()
          partition.foreach { transaction =>
            alertService.sendFraudAlert(transaction)
          }
        }
        
        // Store for investigation
        rdd.saveAsTextFile(s"hdfs://namenode:9000/fraud-alerts/${System.currentTimeMillis()}")
      }
    }
    
    // Real-time metrics
    transactionStream
      .map(t => (t.merchantCategory, t.amount))
      .reduceByKeyAndWindow(_ + _, _ - _, Seconds(300), Seconds(60))
      .foreachRDD(updateTransactionMetrics)
  }
  
  def applyFraudRules(transaction: EnrichedTransaction): RiskTransaction = {
    var riskScore = 0.0
    val riskFactors = scala.collection.mutable.ListBuffer[String]()
    
    // Rule 1: High amount compared to user's average
    if (transaction.amount > transaction.userProfile.avgTransactionAmount * 5) {
      riskScore += 0.3
      riskFactors += "high_amount_vs_average"
    }
    
    // Rule 2: Unusual location
    if (!transaction.userProfile.frequentLocations.contains(transaction.location)) {
      riskScore += 0.2
      riskFactors += "unusual_location"
    }
    
    // Rule 3: Velocity check
    if (transaction.userProfile.transactionsLast24h > 20) {
      riskScore += 0.3
      riskFactors += "high_velocity"
    }
    
    // Rule 4: Merchant risk
    if (transaction.merchantData.riskCategory == "HIGH") {
      riskScore += 0.4
      riskFactors += "high_risk_merchant"
    }
    
    RiskTransaction(transaction, riskScore, riskFactors.toList)
  }
}

case class Transaction(
  id: String,
  userId: String,
  merchantId: String,
  amount: Double,
  location: String,
  timestamp: Long
)

case class UserProfile(
  avgTransactionAmount: Double,
  frequentLocations: Set[String],
  transactionsLast24h: Int
)

case class MerchantData(
  name: String,
  category: String,
  riskCategory: String
)

case class EnrichedTransaction(
  transaction: Transaction,
  userProfile: UserProfile,
  merchantData: MerchantData
) {
  def amount: Double = transaction.amount
  def location: String = transaction.location
  def merchantCategory: String = merchantData.category
}

case class RiskTransaction(
  enrichedTransaction: EnrichedTransaction,
  riskScore: Double,
  riskFactors: List[String]
)
```

### Scenario 2: IoT Sensor Data Processing

```scala
object IoTSensorStreaming {
  
  def setupIoTAnalyticsPipeline(ssc: StreamingContext): Unit = {
    val sensorStream = createMQTTSensorStream(ssc)
    
    // Process different sensor types
    val temperatureAlerts = sensorStream
      .filter(_.sensorType == "temperature")
      .map(parseTemperatureReading)
      .window(Minutes(5), Minutes(1))
      .filter(reading => reading.value > 85.0 || reading.value < -10.0)
      .map(createTemperatureAlert)
    
    val vibrationAnalysis = sensorStream
      .filter(_.sensorType == "vibration")
      .map(parseVibrationReading)
      .transform(rdd => detectVibrationAnomalies(rdd))
    
    val energyUsageAnalytics = sensorStream
      .filter(_.sensorType == "energy")
      .map(parseEnergyReading)
      .window(Hours(1), Minutes(15))
      .transform(rdd => calculateEnergyEfficiencyMetrics(rdd))
    
    // Combine all analytics
    val allAlerts = temperatureAlerts.union(vibrationAnalysis).union(energyUsageAnalytics)
    
    // Store processed data
    allAlerts.foreachRDD { rdd =>
      if (!rdd.isEmpty()) {
        // Send to real-time dashboard
        updateIoTDashboard(rdd)
        
        // Store for historical analysis
        rdd.saveAsTextFile(s"hdfs://namenode:9000/iot-analytics/${System.currentTimeMillis()}")
        
        // Trigger maintenance alerts if needed
        rdd.filter(_.alertLevel == "CRITICAL")
           .foreachPartition(sendMaintenanceAlerts)
      }
    }
  }
}
```

This comprehensive guide provides production-ready patterns and implementations for Apache Spark Streaming applications. The examples demonstrate real-world scenarios including fraud detection, IoT analytics, and robust monitoring frameworks essential for mission-critical streaming applications.

For more advanced Spark techniques, explore our related guides on [PySpark performance optimization](/bonus/advanced-performance-optimization-techniques-for-pyspark-data-pipelines/) and [Apache Spark application development](/blog/2014/04/01/a-standalone-spark-application-in-scala/).