---
title: "Creating an Assembled JAR for a Standalone Spark Application"
date: 2014-04-08T09:47:00+05:30
author: Prabeesh Keezhathra
tags: [Apache Spark, SBT, Scala, Big Data, JAR creation]
keywords: spark single jar, spark executable jar, running spark, stand alone spark jar, spark sbt assembled jar, spark sbt assembly jar, sbt-assembly, sbt spark fat jar, sbt assembly spark jar, spark sbt assembly tutorial, sbt spark uber jar, sbt-assembly tutorial, sbt spark, single jar spark application, introduction to Spark jar creation, spark jar creation, jar spark app
description: Learn how to create a single executable JAR for your Spark project using the sbt-assembly plugin. This guide covers adding the plugin, configuring assembly settings, creating the fat JAR and example project to follow along.
---

In this post, we will discuss how to create an assembled JAR for a standalone Spark application using the `sbt-assembly` plugin. One of my previous posts, we discussed [how to build a stand alone Spark Application using SBT eclipse plugin](/blog/2014/04/01/a-standalone-spark-application-in-scala/). Now, we will take it one step further and show you how to create a fat JAR for your Spark project using the sbt-assembly plugin.

### Adding the sbt-assembly Plugin
The first step in creating an assembled JAR for your Spark application is to add the sbt-assembly plugin. To do this, you will need to add the following line to the `project/plugin.sbt` file:

```scala
addSbtPlugin("com.eed3si9n" % "sbt-assembly" % "0.9.1")
```

### Configuring Assembly Settings
Next, you will need to specify sbt-assembly.git as a dependency in the project/project/build.scala file:

```scala
import sbt._

object Plugins extends Build {
  lazy val root = Project("root", file(".")) dependsOn(
    uri("git://github.com/sbt/sbt-assembly.git#0.9.1")
  )
}
```
In the build.sbt file, add the following contents: <!--more-->
```scala
import AssemblyKeys._ // put this at the top of the file,leave the next line blank

assemblySettings
```

You can use the full keys to configure the assembly plugin for more details [refer](https://github.com/sbt/sbt-assembly)
```
target                        assembly-jar-name             test
assembly-option               main-class                    full-classpath
dependency-classpath          assembly-excluded-files       assembly-excluded-jars
```

### Configuring Merge Strategy
If multiple files share the same relative path, the default strategy is to verify that all candidates have the same contents and error out otherwise. This behavior can be configured for Spark projects using the assembly-merge-strategy as follows:

```scala
mergeStrategy in assembly <<= (mergeStrategy in assembly) { (old) =>
  {
    case PathList("javax", "servlet", xs @ _*) => MergeStrategy.last
    case PathList("org", "apache", xs @ _*) => MergeStrategy.last
    case PathList("com", "esotericsoftware", xs @ _*) => MergeStrategy.last
    case "about.html" => MergeStrategy.rename
    case x => old(x)
  }
}
```

### Creating the Fat JAR
Once you have added the sbt-assembly plugin and configured the assembly settings and merge strategy, you can create the fat JAR for your Spark application. From the root folder of your project, run the following command:
```
sbt/sbt assembly
```

This will create the JAR file in the `target/scala_2.10/ directory`. The name of the JAR file will be in the format of `<ProjectName>-assembly-<version>.jar`.

You can find an example project on how to create an assembled JAR for a Spark application on [GitHub](https://github.com/prabeesh/SparkTwitterAnalysis).

Creating an assembled JAR for a standalone Spark application is a straightforward process when using the `sbt-assembly` plugin. By following the steps outlined in this guide, you can easily create a fat JAR for your Spark application.
