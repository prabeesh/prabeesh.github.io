---
title: "IoT Data Pipeline Architecture: From Sensors to Analytics with MQTT and Apache Spark"
date: 2024-03-25T12:00:00+01:00
draft: false
tags: [IoT, data pipeline, MQTT, Apache Spark, stream processing, sensor data, edge computing, real-time analytics, data architecture, microservices]
keywords: IoT data pipeline, MQTT Spark integration, sensor data processing, IoT analytics architecture, real-time IoT data, edge computing pipeline, IoT microservices, sensor data streaming
description: Build complete IoT data pipeline architectures from sensor collection to real-time analytics. Learn MQTT integration with Apache Spark, edge computing patterns, data preprocessing, and scalable IoT analytics solutions.
---

Combining our expertise in [MQTT messaging](/blog/2013/08/26/mqtt-scala-publisher-and-subscriber/) and [Apache Spark processing](/blog/2023/01/06/performance-tuning-on-apache-spark/), this comprehensive guide demonstrates building production-ready IoT data pipeline architectures that handle millions of sensor readings with real-time analytics capabilities.

## IoT Data Pipeline Architecture Overview

```python
# iot_pipeline_orchestrator.py
import asyncio
import json
import logging
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor
import paho.mqtt.client as mqtt
from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from pyspark.sql.types import *
import redis
import influxdb_client
from influxdb_client.client.write_api import SYNCHRONOUS

@dataclass
class SensorReading:
    device_id: str
    sensor_type: str
    timestamp: datetime
    value: float
    unit: str
    location: Dict[str, float]
    metadata: Dict[str, any]
    
    def to_json(self) -> str:
        data = asdict(self)
        data['timestamp'] = self.timestamp.isoformat()
        return json.dumps(data)
    
    @classmethod
    def from_json(cls, json_str: str) -> 'SensorReading':
        data = json.loads(json_str)
        data['timestamp'] = datetime.fromisoformat(data['timestamp'])
        return cls(**data)
    
    def validate(self) -> bool:
        """Validate sensor reading data"""
        if not self.device_id or not self.sensor_type:
            return False
        if self.value is None or not isinstance(self.value, (int, float)):
            return False
        if not isinstance(self.timestamp, datetime):
            return False
        return True

class IoTDataPipelineOrchestrator:
    def __init__(self, config: Dict):
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # Initialize components
        self.mqtt_client = None
        self.spark_session = None
        self.redis_client = None
        self.influxdb_client = None
        
        # Processing queues
        self.raw_data_queue = asyncio.Queue(maxsize=10000)
        self.processed_data_queue = asyncio.Queue(maxsize=5000)
        
        # Processing statistics
        self.stats = {
            'messages_received': 0,
            'messages_processed': 0,
            'messages_failed': 0,
            'processing_time_avg': 0.0
        }
        
        self.initialize_components()
    
    def initialize_components(self):
        """Initialize all pipeline components"""
        self.setup_mqtt()
        self.setup_spark()
        self.setup_redis()
        self.setup_influxdb()
    
    def setup_mqtt(self):
        """Configure MQTT client for sensor data ingestion"""
        self.mqtt_client = mqtt.Client(
            client_id=f"iot_pipeline_{datetime.now().timestamp()}"
        )
        
        def on_connect(client, userdata, flags, rc):
            if rc == 0:
                self.logger.info("Connected to MQTT broker")
                # Subscribe to all sensor topics
                client.subscribe("sensors/+/+", qos=1)
                client.subscribe("devices/+/status", qos=1)
            else:
                self.logger.error(f"Failed to connect to MQTT broker: {rc}")
        
        def on_message(client, userdata, msg):
            """Handle incoming MQTT messages"""
            try:
                payload = msg.payload.decode('utf-8')
                topic_parts = msg.topic.split('/')
                
                if len(topic_parts) >= 3:
                    device_id = topic_parts[1]
                    sensor_type = topic_parts[2]
                    
                    # Parse sensor data
                    sensor_data = json.loads(payload)
                    
                    # Create sensor reading object
                    reading = SensorReading(
                        device_id=device_id,
                        sensor_type=sensor_type,
                        timestamp=datetime.now(timezone.utc),
                        value=sensor_data.get('value'),
                        unit=sensor_data.get('unit', ''),
                        location=sensor_data.get('location', {}),
                        metadata=sensor_data.get('metadata', {})
                    )
                    
                    # Validate and queue for processing
                    if reading.validate():
                        asyncio.create_task(
                            self.raw_data_queue.put(reading)
                        )
                        self.stats['messages_received'] += 1
                    else:
                        self.logger.warning(f"Invalid sensor reading: {reading}")
                        
            except Exception as e:
                self.logger.error(f"Error processing MQTT message: {e}")
                self.stats['messages_failed'] += 1
        
        self.mqtt_client.on_connect = on_connect
        self.mqtt_client.on_message = on_message
        
        # Connect to MQTT broker
        broker_config = self.config['mqtt']
        self.mqtt_client.connect(
            broker_config['host'],
            broker_config['port'],
            broker_config['keepalive']
        )
    
    def setup_spark(self):
        """Initialize Spark session for stream processing"""
        self.spark_session = SparkSession.builder \
            .appName("IoTDataPipeline") \
            .config("spark.sql.streaming.metricsEnabled", "true") \
            .config("spark.sql.adaptive.enabled", "true") \
            .config("spark.sql.adaptive.coalescePartitions.enabled", "true") \
            .config("spark.streaming.backpressure.enabled", "true") \
            .getOrCreate()
        
        self.spark_session.sparkContext.setLogLevel("WARN")
    
    def setup_redis(self):
        """Initialize Redis for caching and real-time data"""
        redis_config = self.config['redis']
        self.redis_client = redis.Redis(
            host=redis_config['host'],
            port=redis_config['port'],
            db=redis_config['db'],
            decode_responses=True
        )
    
    def setup_influxdb(self):
        """Initialize InfluxDB for time-series data storage"""
        influx_config = self.config['influxdb']
        self.influxdb_client = influxdb_client.InfluxDBClient(
            url=influx_config['url'],
            token=influx_config['token'],
            org=influx_config['org']
        )
    
    async def start_pipeline(self):
        """Start the complete IoT data pipeline"""
        self.logger.info("Starting IoT data pipeline...")
        
        # Start MQTT client
        self.mqtt_client.loop_start()
        
        # Start async processing tasks
        tasks = [
            asyncio.create_task(self.process_raw_data()),
            asyncio.create_task(self.real_time_analytics()),
            asyncio.create_task(self.batch_processing()),
            asyncio.create_task(self.health_monitor()),
        ]
        
        await asyncio.gather(*tasks)
    
    async def process_raw_data(self):
        """Process incoming raw sensor data"""
        while True:
            try:
                # Get raw sensor reading
                reading = await self.raw_data_queue.get()
                
                # Apply data preprocessing
                processed_reading = await self.preprocess_data(reading)
                
                # Store in real-time cache
                await self.store_realtime_data(processed_reading)
                
                # Queue for batch processing
                await self.processed_data_queue.put(processed_reading)
                
                self.stats['messages_processed'] += 1
                
            except Exception as e:
                self.logger.error(f"Error processing raw data: {e}")
                self.stats['messages_failed'] += 1
    
    async def preprocess_data(self, reading: SensorReading) -> SensorReading:
        """Apply data preprocessing and validation"""
        
        # Data cleansing
        if reading.sensor_type == 'temperature':
            # Temperature range validation
            if not (-50 <= reading.value <= 150):
                self.logger.warning(f"Temperature out of range: {reading.value}")
                return None
        
        elif reading.sensor_type == 'humidity':
            # Humidity percentage validation
            reading.value = max(0, min(100, reading.value))
        
        elif reading.sensor_type == 'pressure':
            # Pressure validation (in hPa)
            if not (800 <= reading.value <= 1200):
                self.logger.warning(f"Pressure out of range: {reading.value}")
                return None
        
        # Enrich with location data if missing
        if not reading.location:
            device_location = await self.get_device_location(reading.device_id)
            reading.location = device_location
        
        # Add processing metadata
        reading.metadata['processed_at'] = datetime.now(timezone.utc).isoformat()
        reading.metadata['pipeline_version'] = '1.0'
        
        return reading
    
    async def store_realtime_data(self, reading: SensorReading):
        """Store data in Redis for real-time access"""
        if not reading:
            return
        
        # Store latest reading per device/sensor
        key = f"sensor:{reading.device_id}:{reading.sensor_type}"
        self.redis_client.hset(key, mapping={
            'value': reading.value,
            'timestamp': reading.timestamp.isoformat(),
            'unit': reading.unit
        })
        
        # Set expiration for cleanup
        self.redis_client.expire(key, 3600)  # 1 hour
        
        # Store in time-series list for recent history
        ts_key = f"ts:{reading.device_id}:{reading.sensor_type}"
        self.redis_client.lpush(ts_key, reading.to_json())
        self.redis_client.ltrim(ts_key, 0, 100)  # Keep last 100 readings
        self.redis_client.expire(ts_key, 3600)
    
    async def real_time_analytics(self):
        """Perform real-time analytics and alerting"""
        while True:
            try:
                # Process readings from queue
                reading = await self.processed_data_queue.get()
                
                if not reading:
                    continue
                
                # Check for anomalies
                anomaly = await self.detect_anomalies(reading)
                if anomaly:
                    await self.trigger_alert(reading, anomaly)
                
                # Update real-time dashboards
                await self.update_dashboard_metrics(reading)
                
                # Store in time-series database
                await self.store_timeseries_data(reading)
                
            except Exception as e:
                self.logger.error(f"Error in real-time analytics: {e}")
    
    async def detect_anomalies(self, reading: SensorReading) -> Optional[Dict]:
        """Detect anomalies in sensor readings"""
        device_key = f"stats:{reading.device_id}:{reading.sensor_type}"
        
        # Get historical statistics
        stats = self.redis_client.hmget(device_key, 'mean', 'std', 'count')
        
        if stats[0] and stats[1]:  # Have historical data
            mean = float(stats[0])
            std = float(stats[1])
            count = int(stats[2] or 0)
            
            # Simple z-score anomaly detection
            z_score = abs(reading.value - mean) / max(std, 0.1)
            
            if z_score > 3.0:  # 3 sigma rule
                return {
                    'type': 'statistical_anomaly',
                    'z_score': z_score,
                    'expected_range': [mean - 2*std, mean + 2*std],
                    'actual_value': reading.value
                }
        
        # Update running statistics
        await self.update_running_stats(device_key, reading.value)
        
        return None
    
    async def trigger_alert(self, reading: SensorReading, anomaly: Dict):
        """Trigger alerts for anomalous readings"""
        alert_data = {
            'device_id': reading.device_id,
            'sensor_type': reading.sensor_type,
            'value': reading.value,
            'timestamp': reading.timestamp.isoformat(),
            'anomaly': anomaly,
            'location': reading.location
        }
        
        # Publish alert via MQTT
        alert_topic = f"alerts/{reading.device_id}/{reading.sensor_type}"
        self.mqtt_client.publish(alert_topic, json.dumps(alert_data), qos=1)
        
        # Store alert in database
        alert_key = f"alert:{reading.device_id}:{reading.timestamp.timestamp()}"
        self.redis_client.hset(alert_key, mapping=alert_data)
        self.redis_client.expire(alert_key, 86400 * 7)  # Keep for 7 days
        
        self.logger.warning(f"Alert triggered: {alert_data}")

# Spark-based batch processing component
class SparkBatchProcessor:
    def __init__(self, spark_session: SparkSession, config: Dict):
        self.spark = spark_session
        self.config = config
        
    def create_sensor_data_schema(self):
        """Define schema for sensor data"""
        return StructType([
            StructField("device_id", StringType(), False),
            StructField("sensor_type", StringType(), False),
            StructField("timestamp", TimestampType(), False),
            StructField("value", DoubleType(), False),
            StructField("unit", StringType(), True),
            StructField("location", MapType(StringType(), DoubleType()), True),
            StructField("metadata", MapType(StringType(), StringType()), True)
        ])
    
    def process_hourly_aggregations(self, data_path: str, output_path: str):
        """Process hourly aggregations of sensor data"""
        schema = self.create_sensor_data_schema()
        
        # Read sensor data
        df = self.spark.read \
            .schema(schema) \
            .json(data_path)
        
        # Hourly aggregations
        hourly_agg = df \
            .withColumn("hour", date_trunc("hour", col("timestamp"))) \
            .groupBy("device_id", "sensor_type", "hour") \
            .agg(
                avg("value").alias("avg_value"),
                min("value").alias("min_value"),
                max("value").alias("max_value"),
                stddev("value").alias("std_value"),
                count("*").alias("reading_count")
            )
        
        # Write aggregated data
        hourly_agg.write \
            .mode("append") \
            .partitionBy("sensor_type", "hour") \
            .parquet(output_path)
    
    def detect_device_patterns(self, data_path: str):
        """Analyze device behavior patterns"""
        schema = self.create_sensor_data_schema()
        
        df = self.spark.read \
            .schema(schema) \
            .json(data_path)
        
        # Device activity patterns
        device_patterns = df \
            .withColumn("hour_of_day", hour(col("timestamp"))) \
            .withColumn("day_of_week", dayofweek(col("timestamp"))) \
            .groupBy("device_id", "hour_of_day", "day_of_week") \
            .agg(
                count("*").alias("reading_count"),
                avg("value").alias("avg_value")
            )
        
        return device_patterns
```

## Edge Computing Integration

```python
# edge_processor.py
import asyncio
import json
from typing import Dict, List
import numpy as np
from scipy import signal
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import IsolationForest
import joblib

class EdgeDataProcessor:
    """Process data at the edge before sending to central pipeline"""
    
    def __init__(self, device_id: str, config: Dict):
        self.device_id = device_id
        self.config = config
        
        # Local data buffer
        self.data_buffer = {}
        self.buffer_size = config.get('buffer_size', 100)
        
        # ML models for edge processing
        self.anomaly_detector = None
        self.load_models()
        
        # Processing statistics
        self.processed_count = 0
        self.anomalies_detected = 0
    
    def load_models(self):
        """Load pre-trained ML models for edge processing"""
        try:
            model_path = f"models/anomaly_detector_{self.device_id}.joblib"
            self.anomaly_detector = joblib.load(model_path)
        except FileNotFoundError:
            # Create default model if none exists
            self.anomaly_detector = IsolationForest(
                contamination=0.1,
                random_state=42
            )
    
    async def process_sensor_reading(self, sensor_type: str, value: float, 
                                   timestamp: datetime) -> Dict:
        """Process individual sensor reading at the edge"""
        
        # Add to buffer
        if sensor_type not in self.data_buffer:
            self.data_buffer[sensor_type] = []
        
        self.data_buffer[sensor_type].append({
            'value': value,
            'timestamp': timestamp
        })
        
        # Maintain buffer size
        if len(self.data_buffer[sensor_type]) > self.buffer_size:
            self.data_buffer[sensor_type].pop(0)
        
        # Process if we have enough data
        processed_data = {
            'device_id': self.device_id,
            'sensor_type': sensor_type,
            'raw_value': value,
            'timestamp': timestamp,
            'processed_value': value,
            'quality_score': 1.0,
            'anomaly_score': 0.0,
            'should_transmit': True
        }
        
        if len(self.data_buffer[sensor_type]) >= 10:
            # Apply signal processing
            filtered_value = await self.apply_signal_processing(sensor_type, value)
            processed_data['processed_value'] = filtered_value
            
            # Quality assessment
            quality = await self.assess_data_quality(sensor_type)
            processed_data['quality_score'] = quality
            
            # Anomaly detection
            anomaly_score = await self.detect_edge_anomaly(sensor_type, filtered_value)
            processed_data['anomaly_score'] = anomaly_score
            
            # Transmission optimization
            should_transmit = await self.optimize_transmission(sensor_type, 
                                                             filtered_value, quality)
            processed_data['should_transmit'] = should_transmit
        
        self.processed_count += 1
        return processed_data
    
    async def apply_signal_processing(self, sensor_type: str, 
                                    current_value: float) -> float:
        """Apply signal processing filters"""
        
        values = [reading['value'] for reading in self.data_buffer[sensor_type]]
        values_array = np.array(values)
        
        # Apply different filters based on sensor type
        if sensor_type in ['accelerometer', 'gyroscope']:
            # Low-pass filter for motion sensors
            b, a = signal.butter(3, 0.1, btype='low')
            filtered = signal.filtfilt(b, a, values_array)
            return filtered[-1]
        
        elif sensor_type in ['temperature', 'humidity']:
            # Moving average for environmental sensors
            window_size = min(5, len(values_array))
            return np.mean(values_array[-window_size:])
        
        else:
            # Median filter for general noise reduction
            window_size = min(3, len(values_array))
            return np.median(values_array[-window_size:])
    
    async def assess_data_quality(self, sensor_type: str) -> float:
        """Assess the quality of sensor data"""
        
        if sensor_type not in self.data_buffer or \
           len(self.data_buffer[sensor_type]) < 5:
            return 1.0
        
        values = [reading['value'] for reading in self.data_buffer[sensor_type][-10:]]
        
        # Calculate quality metrics
        std_dev = np.std(values)
        mean_val = np.mean(values)
        
        # Coefficient of variation
        cv = std_dev / max(abs(mean_val), 0.001)
        
        # Quality score based on stability (lower CV = higher quality)
        quality_score = max(0.1, 1.0 - min(cv / 2.0, 0.9))
        
        return quality_score
    
    async def detect_edge_anomaly(self, sensor_type: str, value: float) -> float:
        """Detect anomalies using lightweight edge ML"""
        
        if len(self.data_buffer[sensor_type]) < 20:
            return 0.0
        
        # Prepare data for anomaly detection
        recent_values = [reading['value'] for reading in 
                        self.data_buffer[sensor_type][-20:]]
        
        # Simple statistical anomaly detection
        mean_val = np.mean(recent_values[:-1])  # Exclude current value
        std_val = np.std(recent_values[:-1])
        
        if std_val > 0:
            z_score = abs(value - mean_val) / std_val
            anomaly_score = min(z_score / 3.0, 1.0)  # Normalize to 0-1
        else:
            anomaly_score = 0.0
        
        if anomaly_score > 0.8:
            self.anomalies_detected += 1
        
        return anomaly_score
    
    async def optimize_transmission(self, sensor_type: str, value: float, 
                                  quality: float) -> bool:
        """Optimize data transmission to reduce bandwidth"""
        
        # Always transmit high-quality anomalies
        if quality > 0.8 and \
           await self.detect_edge_anomaly(sensor_type, value) > 0.7:
            return True
        
        # Transmit based on change threshold
        if len(self.data_buffer[sensor_type]) >= 2:
            last_transmitted = self.data_buffer[sensor_type][-2]['value']
            change_threshold = self.config.get('transmission_threshold', {}).get(
                sensor_type, 0.1
            )
            
            if abs(value - last_transmitted) / max(abs(last_transmitted), 0.001) > change_threshold:
                return True
        
        # Periodic transmission (every N readings)
        transmission_interval = self.config.get('transmission_interval', {}).get(
            sensor_type, 10
        )
        
        return self.processed_count % transmission_interval == 0

# Usage example
async def main():
    config = {
        'mqtt': {
            'host': 'localhost',
            'port': 1883,
            'keepalive': 60
        },
        'redis': {
            'host': 'localhost',
            'port': 6379,
            'db': 0
        },
        'influxdb': {
            'url': 'http://localhost:8086',
            'token': 'your-token',
            'org': 'your-org'
        }
    }
    
    # Start IoT pipeline
    pipeline = IoTDataPipelineOrchestrator(config)
    await pipeline.start_pipeline()

if __name__ == "__main__":
    asyncio.run(main())
```

This IoT data pipeline architecture provides a complete solution for handling sensor data from collection through real-time analytics. The design supports edge processing, anomaly detection, and scalable stream processing suitable for production IoT deployments.

For foundational concepts, explore our [MQTT messaging tutorial](/blog/2013/08/26/mqtt-scala-publisher-and-subscriber/) and [Spark performance optimization guide](/blog/2023/01/06/performance-tuning-on-apache-spark/).