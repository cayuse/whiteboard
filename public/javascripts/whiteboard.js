$().ready(function () {
    var socket = io();
    var color = $(".selected").css("background-color");
    var $canvas = $("canvas");
    var context = $canvas[0].getContext("2d");
    var lastEvent;
    var lastRemoteEvent=[-1,-1,-1];
    var mouseDown = false;
    var lineWidth = 5;

    socket.on('connect', function() {
        // connect to the appropriate room
        socket.emit('join', roomId);
    });

    socket.on('mouseup', function() {
        lastRemoteEvent=[-1,-1,-1];
    });

    socket.on('draw message', function (msg) {
        if (lastRemoteEvent[0] === -1)
        {
            lastRemoteEvent = msg;
            return;
        }
        context.beginPath();
        context.moveTo(lastRemoteEvent[0], lastRemoteEvent[1]);
        context.lineTo(msg[0], msg[1]);
        context.strokeStyle = msg[2];
        context.lineWidth = lineWidth;
        context.stroke();
        lastRemoteEvent = msg;
    });

//When clicking on control list items
    $(".controls").on("click", "li", function () {
        //Deselect sibling elements
        $(this).siblings().removeClass("selected");
        //Select clicked element
        $(this).addClass("selected");
        //cache current color
        color = $(this).css("background-color");
    });

//When "New Color" is pressed
    $("#revealColorSelect").click(function () {
        //Show color select or hide the color select
        changeColor();
        $("#colorSelect").toggle();
    });

//update the new color span
    function changeColor() {
        var r = $("#red").val();
        var g = $("#green").val();
        var b = $("#blue").val();
        $("#newColor").css("background-color", "rgb(" + r + "," + g + ", " + b + ")");
    }

//When color sliders change
    $("input[type=range]").change(changeColor);

//When "Add Color" is pressed
    $("#addNewColor").click(function () {
        //Append the color to the controls ul
        var $newColor = $("<li></li>");
        $newColor.css("background-color", $("#newColor").css("background-color"));
        $(".controls ul").append($newColor);
        //Select the new color
        $newColor.click();
    });

//On mouse events on the canvas
    $canvas.mousedown(function (e) {
        lastEvent = e;
        mouseDown = true;
    }).mousemove(function (e) {
        //Draw lines
        if (mouseDown) {
            context.beginPath();
            context.moveTo(lastEvent.offsetX, lastEvent.offsetY);
            context.lineTo(e.offsetX, e.offsetY);
            context.strokeStyle = color;
            context.lineWidth = lineWidth;
            context.stroke();
            lastEvent = e;
            socket.emit('draw message', [e.offsetX, e.offsetY, context.strokeStyle, roomId ])
        }
    }).mouseup(function () {
        mouseDown = false;
        socket.emit('mouseup', roomId);
    }).mouseleave(function () {
        $canvas.mouseup();
        socket.emit('mouseup', roomId);
    });

});