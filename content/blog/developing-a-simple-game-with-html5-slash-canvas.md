---
title: "Developing a simple game with HTML5/canvas"
date: 2013-02-09 10:12:43 +0530
keywords: simple game in html5 javascript, canvas game example, simple game development example, html5 game example, introduction to html5 game development
tags: [HTML5, Python, Google App Engine]
description: This post provides a beginner-friendly guide on developing a simple game using HTML5 canvas and JavaScript. Learn how to create a canvas, draw text and images, rotate the canvas, handle keyboard events, and more. Follow along with the code examples and step-by-step instructions to create your own game. No prior experience with game development is required. Get started today and unleash your creativity with HTML5 game development.
---
HTML5 is the new HTML standard. One of the most interesting new features in HTML5 is the canvas element **canvas** for 2D drawing. A canvas is a rectangular area on an HTML page. All drawing on the canvas must be done using JavaScript. This post goes through the basics of implementing a 2D canvas context, and using the basic canvas functions for developing a simple game.
Creating a canvad context, adding the **canvas** element to your HTML document like so
```html
<canvas id="Canvas" width="800" height="450"></canvas>
``` 
To draw inside the canvas need to use Javascript. First find the canvas element using  getElementById, then initialize the context.
```javascript
	<script>
	var canvas = documnet.getElementById("Canvas");
	var context = canvas.getContext("2d")


	</script>
```
To draw text on a canvas, the most import property and methods are: <!--more-->
	font - deifine the font properties for text
	fillTex(text, x, y) - Draw filled text on the canvas
To set the font, size, and style of HTML5 canvas text, setg the font property of the canvas context to a string containing the font style, size and family separeted by spaces.
```javascript
<script>
context.font = " 20px sans-serif";
context.textAlign = "left";
context.fillStyle="blue";
context.textBaseline = "top"
context.fillText("Press Enter Key to start the game", 240,10);
</script>
``` 
To draw an image on a canvas use the following method
drawImage(image, X, Y, Width, Height)
```javascript
<script>
var bird = new Image();
bird.src = 'bird.png';
context.drawImage(bird, posX, posY, Width, Height);
</script>
```
To rotate the HTML5 Canvas, use the rotate() transform method. The rotate transformation requires an angle in radians.
  context.rotate(angle);
```javascript
<script>
context.rotate(Math.PI/60);
context.drawImage(gun, 0, 0, 150, 50);
</script>
```
To get the event occurring in the document, use  EventListener.
```javascript
document.addEventListener('keydown', function);
```
The functions used for  game development are
The WhichKey() is used for the read the keyboard input. The UP/DOWN arrow keys are used for controlling gun movements. The Enter key is used for start the game. The space key is used for firing.
```javascript
function WhichKey(event)  { 
   if (event.keyCode==38) //UP arrow
     gunUpMove(); 
   if (event.keyCode==40) //Down arrow
     gunDownMove();
   if (event.keyCode==32) // Space Key
     firing();  
   if (event.keyCode==13) //Enter Key
}
```
The counter() is used for setup down counter. Using setInterval(fuction, timeinms) the counter() called by after 1000(1 second).
```javascript
var count = 60;
clear=setInterval(counter, 1000);
function counter() {
  count-= 1;
  if (count <= 0) {
     
   clearInterval(clear);

  }
  
//code for show the counter
}
```
The birdAppearing() is used for appearing bird on the canvas at random points and disappear after a particular  interval.
```javascript
function birdAppearing() {
  if (start==1) { 
    var posx = Math.floor((Math.random()*635)+85);
    var posy = Math.floor((Math.random()*305)+85);  
    context2.drawImage(bird, posx, posy, 40, 40);
    posX = posx;
    posY = posy;  
    setTimeout(function() {context2.clearRect(0, 0, 800, 450);
                 birdAppearing();
               },2000);
  }
}
```
The firing() is used for creating red dotted lines in canvas. If the dotted line coordinates exceed the canvas coordinates then it restores to the initial position. The end point coordinate of the dotted line always compares with the coordinates of the center point of the bird image. If the difference between these points less than the radius of the circle centered at bird image then dotted lines restore the initial position and also the bird will die and get a point.  
```javascript
function firing() { 
  while(1) {
    context.strokeStyle = "red";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(fireStart+= 8,14);
    context.lineTo(fireEnd+= 8,14);
    context.stroke();
    if ((fireEnd*Math.cos(angle*Math.PI/60)) >800 || (fireEnd*Math.sin(angle*Math.PI/60)) >450){
    
     setTimeout(function() {
     context.clearRect(85, 10, fireEnd, 6);
     fireStart = 85;
     fireEnd = 87;
               },16); 
     return;
    }
    if (Math.abs(posX+20-(fireStart*Math.cos(angle*Math.PI/60))) < 20 && (Math.abs( posY+20-(fireEnd*Math.sin(angle*Math.PI/60))) < 20)) {
      setTimeout(function() {
      context.clearRect(85, 10, fireEnd, 6);
      fireStart = 85;
      fireEnd = 87;
               },16);
      context2.clearRect(0, 0, 800, 450);
      context2.drawImage(deadBird, posX, posY, 60, 60);
    
      score += 1;
      context0.font = " 20px sans-serif";
      context0.textAlign = "left";
      context0.fillStyle="black";
      context0.textBaseline = "top";
      context0.clearRect(200, 0, 800, 500);
      context0.fillText('Score :'+ score, 700, 10);
      return;
    }
  }
```
The source code is available [here](https://github.com/prabeesh/Game-Javascript-Canvas-GAE).

To play game [click here](http://prabs-game.appspot.com/)
