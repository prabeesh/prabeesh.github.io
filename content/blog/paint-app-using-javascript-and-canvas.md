---
title: "Paint app using JavaScript and Canvas"
date: 2013-03-30T12:44:00 +05:30
tags: [JavaScript, GoogleAppEngine, Python, Python Flask]
keywords: Flask Application, Flask Example, Flask with Python, beginner Flask example, Python flask introduction, flask example, introduction to flask, beginner guide to Flask, flask with example
description: This post is about developing a simple app using Javascript and HTML5 and Canvas for beginners 
---
An application to draw simple drawings using lines, rectangles and circles in different colours. 

{% img center /images/paint.png 850 350 'image' 'images' %}

The application is developed using JavaScript and HTML5. The canvas feature in HTML5 is used for providing a drawable region. The JavaScript is used to handle drawing functions in this region. The select button to select the different tools to draw. <!--more--> The colour picker is made using the button option. The script basically listens three mouse events mouse down, mouse move and mouse up. This application implemented using two different frameworks Google App Engine and Flask.

### Application with saving facility 

This is done by saving values about each object needed to regenerate the same drawing. When we click the save button the data is transferred to the server as a json string where it is stored along with a name provided by the user. Simply regenerate the drawing using the data received from the server.

In Google App Engine Google data storage is used for data storage. But in Flask sqlite3 is used for data storage. 

Source code: [App with GAE](https://github.com/prabeesh/Paintapp-Javascript-Canvas-GAE) and [App with Flask](https://github.com/prabeesh/Paintapp-Javascript-Canvas-Flask)

The app is deployed in appspot.com, You can find the application [here](http://prabs-paint.appspot.com/)
