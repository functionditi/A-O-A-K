// Connect to the Leap Motion Controller
const controller = new Leap.Controller({ enableGestures: true });

// Log frame data when available
controller.on('frame', function(frame) {
    const outputDiv = document.getElementById('output');
    outputDiv.innerHTML = `Frame ID: ${frame.id} <br> Hands: ${frame.hands.length}`;

    frame.hands.forEach(hand => {
        outputDiv.innerHTML += `<br> Hand ID: ${hand.id}, Type: ${hand.type}, Palm Position: ${hand.palmPosition}`;
    });

    frame.gestures.forEach(gesture => {
        outputDiv.innerHTML += `<br> Gesture Type: ${gesture.type}`;
    });
});

// Connect to the controller
controller.connect();
