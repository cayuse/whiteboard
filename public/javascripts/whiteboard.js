$().ready(function () {
    var socket = io();
    var color = $(".selected").css("background-color");
    var $canvas = $("canvas");
    var context = $canvas[0].getContext("2d");
    var lastEvent;
    var lastRemoteEvent = {};
    var mouseDown = false;
    var lineWidth = 5;
    var lastEmit = $.now();

    $(".draggable").draggable();

    socket.on('connect', function () {
        // connect to the appropriate room
        socket.emit('join', roomId);
    });

    socket.on('mousedown', function (msg) {
        lastRemoteEvent[msg['user']] = [msg['offX']], [msg['offY']];
    });

    socket.on('mouseup', function (msg) {
        lastRemoteEvent[msg['user']] = [-1, -1];
    });

    socket.on('draw message', function (msg) {
        if (!lastRemoteEvent[msg['user']]) {
            lastRemoteEvent[msg['user']] = [-1, -1];
        }
        if (lastRemoteEvent[msg['user']][0] === -1) {
            lastRemoteEvent[msg['user']] = [msg['offX'], msg['offY']];
            return;
        }
        var segment = {
            oldX: lastRemoteEvent[msg['user']][0],
            oldY: lastRemoteEvent[msg['user']][1],
            newX: msg['offX'],
            newY: msg['offY'],
            color: msg['stroke'],
            lineWidth: lineWidth
        };
        drawLine(segment);
        lastRemoteEvent[msg['user']] = [msg['offX'], msg['offY']];
    });

    // this just sets the color when the picker gets clicked
    $(".controls").on("click", "li", function () {
        $(this).siblings().removeClass("selected");
        $(this).addClass("selected");
        color = $(this).css("background-color");
    });

    function changeColor() {
        var r = $("#red").val();
        var g = $("#green").val();
        var b = $("#blue").val();
        $("#newColor").css("background-color", "rgb(" + r + "," + g + ", " + b + ")");
    }

    // these functions draw and emit draw messages
    $canvas.mousedown(function (e) {
        lastEvent = e;
        mouseDown = true;
        drawMessage(e); // emit a draw msg imed on mouse down
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
            drawMessage(e);
        }

        // These functions tell the other clients you are done drawing
    }).mouseup(function () {
        mouseDown = false;
        mouseupMessage();
    }).mouseleave(function () {
        $canvas.mouseup();
        mouseupMessage();
    });

    // Emitter Functions.
    function mouseupMessage() {
        socket.emit('mouseup', {'room': roomId});
    }

    function drawMessage(e) {
        socket.emit('draw message', {
            "offX": e.offsetX,
            "offY": e.offsetY,
            "stroke": context.strokeStyle,
            "roomId": roomId
        });
    }

    /*
    Drawing function. It should recieve a dict in the following format
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