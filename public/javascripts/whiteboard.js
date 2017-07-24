$().ready(function () {
    var socket = io();
    var color = $(".selected").css("background-color");
    var $canvas = $("canvas");
    var context = $canvas[0].getContext("2d");
    var lastEvent;
    var lastRemoteEvent = {};
    var mouseDown = false;
    var lineWidth = 5;

    $(".draggable").draggable();

    socket.on('connect', function () {
        // connect to the appropriate room
        socket.emit('join', roomId);
    });

    socket.on('mouseup', function (msg) {
        lastRemoteEvent[msg['user']] = [-1, -1 ];
    });

    socket.on('draw message', function (msg) {
        if (!lastRemoteEvent[msg['user']])
        {
            lastRemoteEvent[msg['user']] = [-1,-1];
        }
        if (lastRemoteEvent[msg['user']][0] === -1) {
            lastRemoteEvent[msg['user']] = [ msg['offX'], msg['offY'] ];
            return;
        }
        context.beginPath();
        context.moveTo(lastRemoteEvent[msg['user']][0], lastRemoteEvent[msg['user']][1]);
        context.lineTo(msg['offX'], msg['offY']);
        context.strokeStyle = msg['stroke'];
        context.lineWidth = lineWidth;
        context.stroke();
        lastRemoteEvent[msg['user']] = [ msg['offX'], msg['offY'], msg['stroke'] ];
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
    }).mousemove(function (e) {
        if (mouseDown) {
            context.beginPath();
            context.moveTo(lastEvent.offsetX, lastEvent.offsetY);
            context.lineTo(e.offsetX, e.offsetY);
            context.strokeStyle = color;
            context.lineWidth = lineWidth;
            context.stroke();
            lastEvent = e;
            socket.emit('draw message', {
                "offX": e.offsetX,
                "offY": e.offsetY,
                "stroke": context.strokeStyle,
                "roomId": roomId
            })
        }

    // These functions tell the other clients you are done drawing
    }).mouseup(function () {
        mouseDown = false;
        socket.emit('mouseup', roomId);
    }).mouseleave(function () {
        $canvas.mouseup();
        socket.emit('mouseup', roomId);
    });

});