---
title: "HTML5 Canvas Paint Application with JavaScript"
date: 2013-03-30T12:44:00+05:30
author: Prabeesh Keezhathra
tags:
  - JavaScript
  - HTML5 Canvas
  - Google App Engine
  - Flask
keywords:
  - HTML5 canvas paint
  - JavaScript drawing app
  - canvas mouse events
description: A small browser-based paint app on an HTML5 canvas. Covers drawing tools, colors, mouse events, and notes on deploying with Flask.
---
A small browser-based drawing tool built on the HTML5 `<canvas>` element and plain JavaScript.

<img src="/images/paint.png" alt="Paint Application" loading="lazy" style="width:600px; height:400px;">

## How it works

The page contains a `<canvas>` element that listens for three mouse events: `mousedown`, `mousemove`, and `mouseup`. When you press and drag, the handler draws the currently selected shape (line, rectangle, or circle) in the chosen colour. A toolbar above the canvas lets you pick the tool and colour.

All drawing state lives in the browser; nothing hits the server until you explicitly save.
<!--more-->

## Saving and loading drawings

Each drawing is serialized as a JSON array of shape objects (type, start coordinates, end coordinates, colour). When you click **Save**, that JSON is sent to the server with a user-provided name. Loading a drawing fetches the JSON back and replays each shape onto a fresh canvas.

Two back-end implementations exist:

| Back-end | Storage | Notes |
| --- | --- | --- |
| Google App Engine | Google Datastore | Originally deployed on appspot.com (no longer running) |
| Flask | SQLite | Local or any WSGI host |

## Source code

- [App with GAE](https://github.com/prabeesh/Paintapp-Javascript-Canvas-GAE)
- [App with Flask](https://github.com/prabeesh/Paintapp-Javascript-Canvas-Flask)
