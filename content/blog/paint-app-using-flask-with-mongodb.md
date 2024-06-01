---
displayTitle: Flask with MongoDB
title: Paint App using Flask with MongoDB
date: 2013-03-31T21:53:00+05:30
tags: [No SQL Data Base, Python Flask]
keywords: Flask with Mongo DB, flask mongo db example, mongo db flask, beginners guide to flask with mongo db, mongo db with flask, mongo intro to flask, beginner mongo python flask, data base access example flask, data base interaction Flask
description: This post discusses the development of a Python Flask app using MongoDB as the data storage option. It explores the integration of Flask with MongoDB and highlights the benefits of using a NoSQL database system. The post provides an overview of MongoDB's features, such as flexibility, scalability, and ease of use. It also includes commands for performing common operations in MongoDB. The source code for the app is available on GitHub.
---
Here the paint app is modified using with a new database system. The MongoDB is a famous NoSQL database system. The NoSQL database is a simple lightweight mechanism. It provides high scalability and availability. It provides horizontal scaling of data. This system redefined the database concept from the traditional relational database system. 
   MongoDB is an open-source, document-oriented database designed for ease of development and scaling. The main features of MongoDB are flexibility, power, speed, and ease of use. The MongoDB can installed in local machine by following the instructions from [official website](http://docs.mongodb.org/manual/installation/)

Some commands used in the MonoDB operations are given below:

  `db` :- After starting the mongo shell your session will use the test database for context, by default. At any time issue the above operation at the mongo to report the current database.
  `show dbs` :- Display the list of databases from the mongo shell.
  `use mydb` :- Switch to a new database named mydb.
  `help` :- At any point you can access help for the mango shell using this operation.
  `db.things.insert()` :- Insert documents into the collection things.When you insert the first document, the mangod will create both the database and the things collection.
  `show collections` :- Displays the available collections in the database.
  `db.things.find()` :- Finds the documents in the collection. The documents to be found can be specified through arguments of the find function. The cursor of the MongoDB displays only the first 20 output documents. it command is used to display the rest of the documents.

The source code is available in <!--more--> [github](https://github.com/prabeesh/Paintapp-Javascript-Canvas-Flask-MongoDB)
