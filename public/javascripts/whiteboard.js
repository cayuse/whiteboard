$().ready(function () {
    var socket = io();
    var color = $(".selected").css("background-color");
    var $canvas = $("canvas");
    var context = $canvas[0].getContext("2d");
    var lastEvent;
    var oddEvent;
    var curvePoint;
    var lastRemoteEvent = {};
    var mouseDown = false;
    var lineWidth = 5;
    var lastEmit = $.now();

    $(".draggable").draggable();

    socket.on('connect', function () {
        // connect to the appropriate room
        socket.emit('join', roomId);
    });

    socket.on('mousedown', function(msg) {
        lastRemoteEvent[msg['user']] = [msg['offX']], [msg['offY']];
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
        context.quadraticCurveTo(msg['cpX'], msg['cpY'], msg['offX'], msg['offY']);
        //context.lineTo(msg['offX'], msg['offY']);
        context.strokeStyle = msg['stroke'];
        context.lineWidth = lineWidth;
        context.stroke();
        lastRemoteEvent[msg['user']] = [ msg['offX'], msg['offY'] ];
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
        socket.emit('mousedown', { "offX": e.offsetX, "offY": e.offsetY, 'room': roomId }
        );

    }).mousemove(function (e) {
        if (mouseDown && $.now() - lastEmit > 7) {
            oddEvent = !oddEvent;
            if (oddEvent || $.now() - lastEmit > 100)
            {
                curvePoint = e;
                lastEmit = $.now();
                return;
            }
            lastEmit = $.now();
            context.beginPath();
            context.moveTo(lastEvent.offsetX, lastEvent.offsetY);
//            context.quadraticCurveTo(curvePoint.offsetX, curvePoint.offsetY, e.offsetX, e.offsetY);
            context.lineTo(e.offsetX, e.offsetY);
            context.strokeStyle = color;
            context.lineWidth = lineWidth;
            context.stroke();
            lastEvent = e;
            socket.emit('draw message', {
                "offX": e.offsetX,
                "offY": e.offsetY,
                "cpX":  curvePoint.offsetX,
                "cpY":  curvePoint.offsetY,
                "stroke": context.strokeStyle,
                "roomId": roomId
            })
        }

    // These functions tell the other clients you are done drawing
    }).mouseup(function () {
        mouseDown = false;
        socket.emit('mouseup', {'room': roomId} );
    }).mouseleave(function () {
        $canvas.mouseup();
        socket.emit('mouseup', {'room': roomId} );
    });

});