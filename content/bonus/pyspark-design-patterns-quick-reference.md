---
title: "PySpark Design Patterns Quick Reference: Code Snippets for Common Patterns"
date: 2024-01-20T10:00:00+01:00
draft: false
tags: [PySpark, design patterns, quick reference, code snippets, data pipelines, factory pattern, singleton pattern, builder pattern, observer pattern, pipeline pattern]
keywords: PySpark design patterns quick reference, PySpark pattern code snippets, design patterns cheat sheet, PySpark patterns reference guide, data pipeline patterns quick guide
description: A quick reference guide with concise code snippets for implementing common design patterns in PySpark data pipelines. Perfect companion to detailed pattern explanations.
---

This quick reference provides concise code snippets for the five essential design patterns in PySpark data pipelines. For detailed explanations, see [Implementing Design Patterns in PySpark Data Pipelines](/bonus/implementing-design-patterns-in-pyspark-data-pipelines/).

## Factory Pattern

Create data sources without specifying exact types:

```python
from abc import ABC, abstractmethod

class DataSourceFactory(ABC):
    @abstractmethod
    def create_data_source(self):
        pass

class CSVFactory(DataSourceFactory):
    def create_data_source(self):
        return CSVDataSource()

class ParquetFactory(DataSourceFactory):
    def create_data_source(self):
        return ParquetDataSource()

# Usage
factory = CSVFactory()
source = factory.create_data_source()
```

## Singleton Pattern

Ensure only one instance exists:

```python
from threading import Lock

class SparkConfig:
    _instance = None
    _lock = Lock()
    
    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
        return cls._instance

# Usage
config1 = SparkConfig()
config2 = SparkConfig()
assert config1 is config2  # Same instance
```

## Builder Pattern

Construct complex objects step by step:

```python
class TransformBuilder:
    def __init__(self):
        self.filters = []
        self.aggregations = {}
    
    def add_filter(self, condition):
        self.filters.append(condition)
        return self
    
    def add_aggregation(self, col, func):
        self.aggregations[col] = func
        return self
    
    def build(self):
        return DataTransform(self.filters, self.aggregations)

# Usage
transform = (TransformBuilder()
    .add_filter("status == 'active'")
    .add_aggregation("amount", "sum")
    .build())
```

## Observer Pattern

Notify multiple components of data changes:

```python
from abc import ABC, abstractmethod

class Observer(ABC):
    @abstractmethod
    def update(self, event):
        pass

class DataSubject:
    def __init__(self):
        self.observers = []
    
    def register(self, observer):
        self.observers.append(observer)
    
    def notify(self, event):
        for obs in self.observers:
            obs.update(event)

# Usage
subject = DataSubject()
subject.register(LoggingObserver())
subject.notify(DataEvent(data))
```

## Pipeline Pattern

Chain transformations sequentially:

```python
from abc import ABC, abstractmethod

class Transform(ABC):
    def __init__(self, next_transform=None):
        self.next = next_transform
    
    def set_next(self, transform):
        self.next = transform
        return transform
    
    @abstractmethod
    def process(self, data):
        pass

class CleanTransform(Transform):
    def process(self, data):
        cleaned = data.dropna()
        return self.next.process(cleaned) if self.next else cleaned

# Usage
pipeline = CleanTransform()
pipeline.set_next(ValidateTransform()).set_next(EnrichTransform())
result = pipeline.process(df)
```

## Quick Tips

- **Factory**: Use when you need flexible object creation
- **Singleton**: Use for shared resources like Spark sessions
- **Builder**: Use for complex objects with many optional parameters
- **Observer**: Use for event-driven data processing
- **Pipeline**: Use for sequential data transformations

These patterns help create maintainable, testable, and scalable PySpark pipelines. Choose the pattern that best fits your specific use case.

