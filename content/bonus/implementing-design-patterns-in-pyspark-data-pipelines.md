---
title: "PySpark Design Patterns for Data Pipelines"
date: 2023-01-14T14:37:59+01:00
draft: false
tags:
  - PySpark
  - design patterns
  - data pipelines
  - factory pattern
  - singleton pattern
  - builder pattern
  - observer pattern
  - pipeline pattern
  - data engineering
keywords:
  - PySpark design patterns
  - PySpark tutorial
  - data pipeline design patterns
  - factory pattern PySpark
  - singleton pattern PySpark
  - builder pattern PySpark
  - observer pattern PySpark
  - pipeline pattern PySpark
description: A hands-on PySpark tutorial showing how to apply five classic software design patterns, factory, singleton, builder, observer, and pipeline, to build cleaner, more maintainable data pipelines. Full code examples you can run.
---

If you want to write PySpark data pipelines that stay clean as they grow, design patterns are the most reliable tool to reach for. Pipelines get complex quickly: new data sources appear, transformations multiply, one-off scripts turn into production systems. Classic software design patterns give you proven structures to keep that complexity under control.

This tutorial walks through the five most useful patterns for a PySpark pipeline, each with a complete, runnable example:

- [Factory Pattern](#factory-pattern), swap data sources (CSV, Parquet, JSON) without changing pipeline code
- [Singleton Pattern](#singleton-pattern), share one SparkSession or sink across the whole pipeline
- [Builder Pattern](#builder-pattern), construct complex transforms with optional parameters
- [Observer Pattern](#observer-pattern), react to data changes across loosely coupled components
- [Pipeline Pattern](#pipeline-pattern), chain transforms into a clear, ordered flow

Each example uses Python's `abc` module to define abstract base classes and concrete subclasses. If you haven't used `abc.ABC` before: it lets you declare a class contract via `@abstractmethod`, and any subclass must implement those methods or Python will refuse to instantiate it.

## Quick reference: when to use each pattern

| Pattern | Use when you need to… | Example |
| --- | --- | --- |
| Factory | Create data sources or transforms without hard-coding the concrete type | `DataSourceFactory` → CSV, Parquet, JSON |
| Singleton | Share one expensive object (SparkSession, connection, sink) | Single `DataSink`, single `SparkSession` |
| Builder | Construct objects with many optional parameters | `DataTransformBuilder().set_param1(...).build()` |
| Observer | Let several components react when data changes | Multiple sinks notified on a new batch |
| Pipeline | Chain ordered stages in an ETL flow | `extract → clean → enrich → load` |

## Factory Pattern {#factory-pattern}

The factory pattern is a creational pattern: a parent class defines an interface for creating objects, and subclasses decide which concrete class to instantiate. In a data pipeline, this lets you plug in different input formats, CSV, Parquet, JSON, without the pipeline code caring about the underlying format.

```Python
from abc import ABC, abstractmethod

class DataSourceFactory(ABC):
    """Abstract factory for generating data sources."""
    
    @abstractmethod
    def create_data_source(self):
        pass

class CSVDataSourceFactory(DataSourceFactory):
    """Concrete factory for generating CSV data sources."""
    
    def create_data_source(self):
        return CSVDataSource()

class ParquetDataSourceFactory(DataSourceFactory):
    """Concrete factory for generating Parquet data sources."""
    
    def create_data_source(self):
        return ParquetDataSource()

class DataSource(ABC):
    """Abstract base class for data sources."""
    
    @abstractmethod
    def load_data(self):
        pass

class CSVDataSource(DataSource):
    """Concrete implementation of a CSV data source."""
    
    def load_data(self):
        # Use spark.read.csv(...) to load data from a CSV file
        pass

class ParquetDataSource(DataSource):
    """Concrete implementation of a Parquet data source."""
    
    def load_data(self):
        # Use spark.read.parquet(...) to load data from a Parquet file
        pass

# Example usage
factory = CSVDataSourceFactory()
data_source = factory.create_data_source()
data = data_source.load_data()
```

`DataSourceFactory` is the abstract factory; `CSVDataSourceFactory` and `ParquetDataSourceFactory` are concrete factories that each produce a specific `DataSource`. Pick the factory that matches the input format and call `create_data_source()`. The rest of the pipeline works against the `DataSource` interface and stays decoupled from the format.

When to use it: any time your pipeline needs to support more than one input format or runtime configuration.

## Singleton Pattern {#singleton-pattern}

The singleton pattern restricts a class to a single instance. In Spark, the canonical example is the `SparkSession`: you want exactly one, shared across the whole job. Output sinks and connection pools are similar cases.

```Python
from threading import Lock

class DataSink:
    """Class for writing data to a sink."""
    
    _instance = None
    _lock = Lock()
    
    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
        return cls._instance
    
    def write_data(self, data):
        # Write data to sink
        pass

# Example usage
sink1 = DataSink()
sink2 = DataSink()

# sink1 and sink2 are the same instance
assert sink1 is sink2
```

`__new__` checks whether an instance already exists and returns it if so. `_lock` makes it safe under concurrent access, which matters when multiple threads bootstrap the pipeline at once.

When to use it: anything expensive to create and safe to share (SparkSession, Kafka producer, HTTP client, metrics emitter).

## Builder Pattern {#builder-pattern}

The builder pattern separates construction of a complex object from its representation. It shines when a class has many optional parameters. Rather than a constructor with ten arguments, you get a fluent API the reader can scan top-to-bottom.

```Python
class DataTransform:
    """Class for transforming data."""
    
    def __init__(self, **kwargs):
        self.param1 = kwargs.get("param1")
        self.param2 = kwargs.get("param2")
        self.param3 = kwargs.get("param3")
    
    def transform(self, data):
        # Transform data using specified parameters
        pass

class DataTransformBuilder:
    """Builder for creating DataTransform objects."""
    
    def __init__(self):
        self.param1 = None
        self.param2 = None
        self.param3 = None
    
    def set_param1(self, param1):
        self.param1 = param1
        return self
    
    def set_param2(self, param2):
        self.param2 = param2
        return self
    
    def set_param3(self, param3):
        self.param3 = param3
        return self
    
    def build(self):
        return DataTransform(
            param1=self.param1,
            param2=self.param2,
            param3=self.param3,
        )

# Example usage
transform = (
    DataTransformBuilder()
    .set_param1("value1")
    .set_param3("value3")
    .build()
)
```

Each setter returns `self`, so the calls chain naturally and the caller sets only the parameters that matter for their use case.

When to use it: data readers, writers, and transforms with 5+ optional knobs (partitioning, compression, schema overrides, retry policy, etc.).

## Observer Pattern {#observer-pattern}

The observer pattern sets up a one-to-many dependency: when a subject changes state, it notifies every registered observer. In a data pipeline, this is useful when one successful batch should trigger several follow-up actions, write to the warehouse, update a dashboard, emit a metric, without hard-wiring them into the pipeline.

```Python
from abc import ABC, abstractmethod

class DataEvent(ABC):
    """Abstract base class for data events."""
    
    @abstractmethod
    def get_data(self):
        pass

class DataUpdatedEvent(DataEvent):
    """Concrete event fired when data is updated."""
    
    def __init__(self, data):
        self.data = data
    
    def get_data(self):
        return self.data

class DataObserver(ABC):
    """Abstract base class for data observers."""
    
    @abstractmethod
    def update(self, event):
        pass

class DataTransformObserver(DataObserver):
    """Observer that applies a transform when data is updated."""
    
    def __init__(self, transform):
        self.transform = transform
    
    def update(self, event):
        data = event.get_data()
        transformed_data = self.transform.transform(data)
        # Do something with the transformed data

class DataSubject:
    """Manages observers and fires data events."""
    
    def __init__(self):
        self.observers = []
    
    def register_observer(self, observer):
        self.observers.append(observer)
    
    def remove_observer(self, observer):
        self.observers.remove(observer)
    
    def notify_observers(self, event):
        for observer in self.observers:
            observer.update(event)

# Example usage
subject = DataSubject()
transform_observer = DataTransformObserver(transform)
subject.register_observer(transform_observer)
subject.notify_observers(DataUpdatedEvent(data))
```

The `DataSubject` keeps the list of `DataObserver` instances and calls each one's `update()` when `notify_observers()` fires. Adding a new reaction is a one-line change: implement a new observer and register it.

When to use it: fan-out reactions to a pipeline event (audit logs, cache invalidation, alerting).

## Pipeline Pattern {#pipeline-pattern}

The pipeline pattern (sometimes called chain-of-responsibility for data) chains a series of processing steps so the output of each stage feeds the next. It maps naturally onto ETL, extract, transform, load.

```Python
from abc import ABC, abstractmethod

class DataTransform(ABC):
    """Abstract base class for data transforms in a pipeline."""
    
    def __init__(self, next=None):
        self.next = next
    
    def set_next(self, next):
        self.next = next
        return next
    
    @abstractmethod
    def transform(self, data):
        pass

class TransformA(DataTransform):
    def transform(self, data):
        # Apply transform A
        transformed_data = data
        if self.next:
            return self.next.transform(transformed_data)
        return transformed_data

class TransformB(DataTransform):
    def transform(self, data):
        # Apply transform B
        transformed_data = data
        if self.next:
            return self.next.transform(transformed_data)
        return transformed_data

class TransformC(DataTransform):
    def transform(self, data):
        # Apply transform C
        transformed_data = data
        if self.next:
            return self.next.transform(transformed_data)
        return transformed_data

# Example usage
transform_a = TransformA()
transform_b = TransformB()
transform_c = TransformC()

transform_a.set_next(transform_b).set_next(transform_c)
transformed_data = transform_a.transform(data)
```

`set_next()` returns the next stage so you can wire the chain in one readable line. Each concrete transform only knows about its own logic and the handoff; adding, removing, or reordering steps has zero ripple effect.

When to use it: any multi-stage ETL/ELT flow, especially when stages need to be composed differently per job.

## Putting it all together

These five patterns combine well. A production pipeline typically looks like:

1. A singleton `SparkSession` shared by every component.
2. A factory that picks the right `DataSource` based on config.
3. A builder that assembles the transform chain with per-job parameters.
4. A pipeline that chains the transforms in order.
5. An observer that fires side effects (metrics, alerts, downstream notifications) after each successful run.

## Frequently asked questions

### What are design patterns in PySpark?

They are reusable solutions to recurring problems in PySpark code, for example, how to create data sources flexibly (factory), how to share one `SparkSession` (singleton), or how to compose transforms (pipeline). The same shapes show up across almost every non-trivial pipeline.

### Which pattern should I start with?

Start with factory and pipeline. Factory removes hard-coded data formats; pipeline gives you a clean ETL skeleton. The others slot in once those two are in place.

### What is the difference between the factory and singleton patterns?

Factory produces many instances of different concrete classes that share an interface. Singleton restricts a class to exactly one instance. They solve opposite problems and are often used together, a factory object itself may be implemented as a singleton.

### Is an abstract class the same as an `abc` class in Python?

Yes. In Python, abstract base classes live in the `abc` module; any class that inherits from `abc.ABC` and uses `@abstractmethod` is what people casually call an "abc class". It defines a contract that subclasses must implement.

### Where can I learn more PySpark design patterns?

Keep going: [Advanced PySpark Design Patterns: Real-World Implementation Examples](/bonus/advanced-pyspark-design-patterns-implementation/) covers strategy, decorator, command, and template method patterns. For a one-page cheat sheet, see the [PySpark Design Patterns Quick Reference](/bonus/pyspark-design-patterns-quick-reference/). And if you're tuning an existing pipeline, [Apache Spark Performance Tuning](/blog/2023/01/06/performance-tuning-on-apache-spark/) pairs well with these patterns.

## Conclusion

We covered five essential design patterns, factory, singleton, builder, observer, and pipeline, and showed how each one improves a real PySpark data pipeline. Used together they cover most production needs: flexible data sources, shared resources, configurable transforms, event fan-out, and readable ETL chains. The next step is to try each one on a small PySpark job of your own, nothing locks the lessons in faster than running the code.
