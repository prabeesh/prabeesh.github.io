---
title: "Paint app using JavaScript and Canvas"
date: 2013-03-30T12:44:00+05:30
tags: [JavaScript, GoogleAppEngine, Python, Python Flask]
keywords: Flask Application, Flask Example, Flask with Python, beginner Flask example, Python flask introduction, flask example, introduction to flask, beginner guide to Flask, flask with example
description: This post is a beginner's guide to developing a simple paint app using JavaScript, HTML5, and Canvas. Learn how to draw lines, rectangles, and circles in different colors, and explore the functionality of the select button and color picker. The app also includes a saving feature, allowing users to store and regenerate their drawings. Choose between two frameworks, Google App Engine and Flask, for data storage. Check out the source code and try the app on appspot.com.
---
An application to draw simple drawings using lines, rectangles and circles in different colours. 

<img src="/images/paint.png" alt="Paint Application" loading="lazy" style="width:600px; height:400px;">

The application is developed using JavaScript and HTML5. The canvas feature in HTML5 is used for providing a drawable region. The JavaScript is used to handle drawing functions in this region. The select button to select the different tools to draw. <!--more--> The colour picker is made using the button option. The script basically listens three mouse events mouse down, mouse move and mouse up. This application implemented using two different frameworks Google App Engine and Flask.

### Application with saving facility 

This is done by saving values about each object needed to regenerate the same drawing. When we click the save button the data is transferred to the server as a json string where it is stored along with a name provided by the user. Simply regenerate the drawing using the data received from the server.

In Google App Engine Google data storage is used for data storage. But in Flask sqlite3 is used for data storage. 

Source code: [App with GAE](https://github.com/prabeesh/Paintapp-Javascript-Canvas-GAE) and [App with Flask](https://github.com/prabeesh/Paintapp-Javascript-Canvas-Flask)

The app is deployed in appspot.com, You can find [the application here](http://prabs-paint.appspot.com/)
