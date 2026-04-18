---
title: "PySpark Design Patterns Quick Reference"
date: 2024-01-20T10:00:00+01:00
draft: false
tags:
  - PySpark
  - design patterns
  - cheat sheet
keywords:
  - PySpark patterns cheat sheet
  - factory builder singleton PySpark
  - data pipeline patterns reference
description: "One-page cheat sheet with runnable snippets for the five core PySpark design patterns: factory, singleton, builder, observer, and pipeline."
---

Minimal runnable snippets for the five core patterns. For the why and when, see [Implementing Design Patterns in PySpark Data Pipelines](/bonus/implementing-design-patterns-in-pyspark-data-pipelines/) and [Advanced PySpark Design Patterns](/bonus/advanced-pyspark-design-patterns-implementation/).

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

## Quick tips

- **Factory**: flexible object creation when you need to swap the concrete class
- **Singleton**: shared resources like the Spark session
- **Builder**: complex objects with many optional parameters
- **Observer**: event-driven data processing with fan-out
- **Pipeline**: ordered chain of transformations

Each snippet above is self-contained. Copy it into a new module, wire it into your pipeline, and adjust the class names to match your domain. For a deeper walkthrough of when and why to use each one, see the [full tutorial](/bonus/implementing-design-patterns-in-pyspark-data-pipelines/). For strategy, decorator, command, and template method patterns, see the [advanced patterns post](/bonus/advanced-pyspark-design-patterns-implementation/).

