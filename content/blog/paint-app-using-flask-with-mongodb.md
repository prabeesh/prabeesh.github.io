---
displayTitle: Flask with MongoDB
title: "A Web Paint App with Flask and MongoDB"
date: 2013-03-31T21:53:00+05:30
tags:
  - Python Flask
  - MongoDB
  - NoSQL
  - Canvas API
keywords:
  - Flask MongoDB
  - Python Flask tutorial
  - HTML5 canvas Flask
  - MongoDB CRUD Python
description: Build a small web paint app backed by Flask and MongoDB. Covers the HTML5 canvas front-end, the Flask routes that accept drawing data, and the MongoDB schema.
---

Schema-less, document-shaped data like freehand drawings is a good fit for MongoDB: there's no rigid table to design around stroke coordinates that vary per drawing. This post ties the canvas front-end to a Flask backend that persists drawings in MongoDB.

## How the app works

The user draws lines, rectangles, or circles on an HTML5 canvas. Each shape is stored in a JavaScript object with its coordinates and colour. When the user clicks "save", the frontend POSTs the entire drawing as a JSON string to Flask, which inserts it into MongoDB keyed by image name. Loading a drawing is a GET request: Flask queries MongoDB, passes the JSON back to the template, and the canvas redraws it.

## The Flask backend

The entire server is one file. It connects to a local MongoDB instance, serves the canvas page, and handles save/load:

```python
from flask import Flask, request, render_template, Response
from pymongo import Connection

app = Flask(__name__)

connection = Connection()
collection = connection.paint.images

@app.route("/")
@app.route('/<imagename>', methods=['POST', 'GET'])
def mainpage(imagename=None):
    if request.method == 'GET':
        if imagename:
            rows = collection.find({'imgname': imagename})
            if rows:
                for row in rows:
                    imgdata = row["imgdata"]
                    return render_template('paint.html', saved=imgdata)
            else:
                resp = Response(
                    '<html><script>'
                    'alert("Image not found");'
                    'document.location.href="/"'
                    '</script></html>'
                )
                return resp
        else:
            return render_template('paint.html')

    if request.method == 'POST':
        imgname = request.form['imagename']
        imgdata = request.form['string']
        collection.insert({"imgname": imgname, "imgdata": imgdata})
        return Response("saved")

if __name__ == '__main__':
    app.debug = True
    app.run()
```

A few things to note:

- `Connection()` (from the older pymongo API) connects to `localhost:27017` by default. In current pymongo you would use `MongoClient()`.
- The route handles both `/` (new drawing) and `/<imagename>` (load or save). The `methods` list lets the same URL respond to GET and POST.
- On save, the drawing data arrives as a JSON string in `request.form['string']` and gets stored verbatim in MongoDB. No schema needed.
- On load, Flask passes the stored JSON string into the Jinja template as `saved`, and the JavaScript parses it back into drawing objects.

## The MongoDB document

Each saved drawing produces one document in the `paint.images` collection:

```json
{
    "_id": ObjectId("..."),
    "imgname": "my-drawing",
    "imgdata": "{\"line\":[{\"beginx\":120,\"beginy\":80,\"endx\":400,\"endy\":300,\"color\":\"red\"}],\"rect\":[],\"circle\":[]}"
}
```

The `imgdata` field is a JSON string containing three arrays (one per shape type). Each shape stores its start/end coordinates and colour. This is the simplest possible approach: store the drawing as an opaque blob keyed by name.

## The canvas frontend

The template (`templates/paint.html`) sets up two stacked canvases: one for the active stroke being drawn, one for the committed shapes underneath. The drawing tools (line, rectangle, circle) are selected from a dropdown, and colour buttons set the stroke colour.

The core interaction captures `mousedown`, `mousemove`, and `mouseup` events:

```javascript
var data = {"line":[], "rect":[], "circle":[]};

canvas.addEventListener('mousedown', function(evt) {
    var mousePos = getMousePos(canvas, evt);
    select = 1;
    beginX = mousePos.x;
    beginY = mousePos.y;
}, false);

canvas.addEventListener('mousemove', function(evt) {
    var mousePos = getMousePos(canvas, evt);
    if (select && toolselect.value == 'line') {
        endX = mousePos.x;
        endY = mousePos.y;
        drawLine(beginX, beginY, endX, endY);
    }
    if (select && toolselect.value == 'rect') {
        sideX = mousePos.x - beginX;
        sideY = mousePos.y - beginY;
        drawRect(beginX, beginY, sideX, sideY);
    }
    if (select && toolselect.value == 'circle') {
        radius = mousePos.x - beginX;
        drawCircle(beginX, beginY, radius);
    }
}, false);

canvas.addEventListener('mouseup', function(evt) {
    select = 0;
    context1.drawImage(canvas, 0, 0);

    if (toolselect.value == 'line') {
        data.line.push({
            beginx: beginX, beginy: beginY,
            endx: endX, endy: endY, color: currentColor
        });
    }
    if (toolselect.value == 'rect') {
        data.rect.push({
            beginx: beginX, beginy: beginY,
            sidex: sideX, sidey: sideY, color: currentColor
        });
    }
    if (toolselect.value == 'circle') {
        data.circle.push({
            beginx: beginX, beginy: beginY,
            radius: radius, color: currentColor
        });
    }
}, false);
```

On `mouseup`, the shape is committed to `canvas1` (the background layer) with `drawImage`, and its coordinates are pushed into the `data` object. That object is what gets serialised to JSON and sent to Flask on save.

Save and load use jQuery to POST/redirect:

```javascript
function saveImage() {
    if (imagename.value == "")
        alert("Image name cannot be empty");
    else {
        $.post("/" + imagename.value,
               {imagename: imagename.value, string: JSON.stringify(data)});
        alert("saved");
    }
}

function loadImage() {
    if (imagename.value == "")
        alert("Image name cannot be empty");
    else
        document.location.href = "/" + imagename.value;
}
```

When loading, Flask passes the stored JSON to the template, and the `init()` function rehydrates it:

```javascript
function init() {
    var dataString = "{{ saved }}";
    if (dataString) {
        data = JSON.parse(dataString.replace(/&#34;/g, '"'));
        drawAll();
    }
}
```

`&#34;` is the HTML entity for `"`, which Jinja escapes by default. The `replace` call converts it back before parsing.

## Running it

```bash
# Start MongoDB
mongod

# In another terminal
pip install flask pymongo
python test.py
```

Open `http://localhost:5000`, draw something, type a name, and click save. Navigate to `http://localhost:5000/your-name` to load it back.

The complete source is on [GitHub](https://github.com/prabeesh/Paintapp-Javascript-Canvas-Flask-MongoDB).
