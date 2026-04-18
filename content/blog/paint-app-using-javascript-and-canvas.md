---
title: "HTML5 Canvas Paint Application: Building Interactive Drawing Tools with JavaScript"
date: 2013-03-30T12:44:00+05:30
author: Prabeesh Keezhathra
tags: [JavaScript, HTML5 Canvas, Web Development, Interactive Applications, Google App Engine, Python Flask]
keywords:
  - HTML5 canvas paint application
  - JavaScript drawing app
  - canvas paint tool
  - interactive web drawing
  - HTML5 canvas tutorial
  - JavaScript paint program
  - web-based drawing application
  - canvas mouse events
description: Build an interactive HTML5 canvas paint application with JavaScript. Learn drawing tools implementation, color selection, shape creation, data persistence with Google App Engine and Flask backends for web-based drawing applications.
---
An application to draw simple drawings using lines, rectangles and circles in different colours. 

<img src="/images/paint.png" alt="Paint Application" loading="lazy" style="width:600px; height:400px;">

The application is developed using JavaScript and HTML5. The canvas feature in HTML5 is used for providing a drawable region. The JavaScript is used to handle drawing functions in this region. The select button to select the different tools to draw. <!--more--> The colour picker is made using the button option. The script basically listens three mouse events mouse down, mouse move and mouse up. This application implemented using two different frameworks Google App Engine and Flask.

### Application with saving facility 

This is done by saving values about each object needed to regenerate the same drawing. When we click the save button the data is transferred to the server as a json string where it is stored along with a name provided by the user. Simply regenerate the drawing using the data received from the server.

In Google App Engine Google data storage is used for data storage. But in Flask sqlite3 is used for data storage. 

Source code: [App with GAE](https://github.com/prabeesh/Paintapp-Javascript-Canvas-GAE) and [App with Flask](https://github.com/prabeesh/Paintapp-Javascript-Canvas-Flask)

The app is deployed in appspot.com, You can find [the application here](http://prabs-paint.appspot.com/)
