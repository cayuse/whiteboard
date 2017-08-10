$().ready(function () {
    var socket = io();
    var color = $(".selected").css("background-color");
    var canvas = $("canvas");
    var context = canvas[0].getContext("2d");
    var lastEvent;
    var lastRemoteEvent = {};
    var mouseDown = false;
    var lineWidth = 5;
    var lastEmit = $.now();
    var timerInterval = 50; // miliseconds
    var myTimer;
    var curTime = 0;
    var myData;

    $(".draggable").draggable();

    // The socket.on events immediately call local functions, so that the events can be triggered locally.
    // emit a message when the room is joined.
    socket.on('connect', function () {
        // connect to the appropriate room
        socket.emit('join', {"name": roomId});
    });

    // clear remote user's last event when it sends a mouseup
    socket.on('mouseup', function (msg) {
        mouseup(msg);
    });

    function mouseup(msg) {
        lastRemoteEvent[msg.user] = [-1, -1];
    }

    // clear board
    socket.on('clear message', function (msg) {
        clearBoard(msg.color);
    });

    // draw events triggered by socket messages
    socket.on('draw message', function (msg) {
        drawMessage(msg);
    });

    function drawMessage(msg) {
        if (!lastRemoteEvent[msg.user]) {
            lastRemoteEvent[msg.user] = [-1, -1];
        }
        if (lastRemoteEvent[msg.user][0] === -1) {
            lastRemoteEvent[msg.user] = [msg.offX, msg.offY];
            return;
        }
        var segment = {
            oldX: lastRemoteEvent[msg.user][0],
            oldY: lastRemoteEvent[msg.user][1],
            newX: msg.offX,
            newY: msg.offY,
            color: msg.stroke,
            lineWidth: lineWidth
        };
        drawLine(segment);
        lastRemoteEvent[msg.user] = [msg.offX, msg.offY];
    }


    // function to playback the whiteboard in realtime.

    function playTimed() {
        if (myData.length > 0)
        {
            curTime += timerInterval;
            while (myData.length > 0 && myData[0].timestamp < curTime){
                forwardMessage(myData.shift());
            }
        } else {
            clearInterval(myTimer);
        }
    }
    // handle entire data dump
    socket.on('data dump', function (msg) {
        if (realtime === "true") {
            myData = msg;
            if (myData.length > 0){
                curTime = myData[0].timestamp;
                myTimer = setInterval(function() {
                    if (myData.length > 0)
                    {
                        curTime += timerInterval;
                        while (myData.length > 0 && myData[0].timestamp < curTime){
                            forwardMessage(myData.shift());
                        }
                    } else {
                        clearInterval(myTimer);
                    }
                }, timerInterval);
            }
        } else {
            msg.forEach(function (item) {
                forwardMessage(item);
            })
        }
    });

    function forwardMessage(msg) {
        if (msg.type === "mouseup") {
            mouseup(msg);
        } else if (msg.type === "clear message") {
            clearBoard(msg.color);
        } else if (msg.type === "draw message") {
            drawMessage(msg);
        }
    }

    // this just sets the color when the picker gets clicked
    // will probably be handled differently in the future
    $(".controls").on("click", "li", function () {
        $(this).siblings().removeClass("selected");
        $(this).addClass("selected");
        color = $(this).css("background-color");
    });

    $(".controls").on("dblclick", 'li', function () {
        color = $(this).css("background-color");
        clearBoard(color);
        emitClearMessage();
    });

    //helpers for above
    function clearBoard(myColor) {
        context.fillStyle = myColor;
        context.fillRect(0, 0, 1900, 1000);
    }

    function changeColor() {
        var r = $("#red").val();
        var g = $("#green").val();
        var b = $("#blue").val();
        $("#newColor").css("background-color", "rgb(" + r + "," + g + ", " + b + ")");
    }

    // these functions draw and emit draw messages
    canvas.mousedown(function (e) {
        lastEvent = e;
        mouseDown = true;
        emitDrawMessage(e); // emit a draw msg imed on mouse down
    }).mousemove(function (e) {
        if (mouseDown && $.now() - lastEmit > 10) { // reduce emit frequency
            var segment = {
                oldX: lastEvent.offsetX,
                oldY: lastEvent.offsetY,
                newX: e.offsetX,
                newY: e.offsetY,
                color: color,
                lineWidth: lineWidth
            };
            drawLine(segment);
            lastEvent = e;
            emitDrawMessage(e);
        }

        // These functions tell the other clients you are done drawing
    }).mouseup(function () {
        mouseDown = false;
        emitMouseupMessage();
    }).mouseleave(function () {
        canvas.mouseup();
        emitMouseupMessage();
    });

    // Emitter Functions.
    function emitMouseupMessage() {
        socket.emit('mouseup', {'room': roomId});
    }

    function emitClearMessage() {
        socket.emit('clear message', {'color': color, 'room': roomId});
    }

    function emitDrawMessage(e) {
        socket.emit('draw message', {
            "offX": e.offsetX,
            "offY": e.offsetY,
            "stroke": context.strokeStyle,
            "room": roomId
        });
    }

    /*
    Drawing function. It should receive a dict in the following format
    drawSegment = { oldX: int, oldY: int, newX: int newY: int
                    strokeStyle: color, lineWidth: int}
     */
    function drawLine(s) {
        context.beginPath();
        context.moveTo(s.oldX, s.oldY);
        var cx = (s.oldX + s.newX) / 2;
        var cy = (s.oldY + s.newY) / 2;
        context.quadraticCurveTo(cx, cy, s.newX, s.newY);
        //context.lineTo(e.offsetX, e.offsetY);
        context.strokeStyle = s.color;
        context.lineWidth = s.lineWidth;
        context.stroke();
    }
});
