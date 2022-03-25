const socket = io(); // connect to server

// elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input'); // find inside form
const $messageFormButton = $messageForm.querySelector('button');
const $sendLoationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');
const $sidebar = document.querySelector('#sidebar');

// templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {
    // new message element
    const $newMessage = $messages.lastElementChild;

    // height of the new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    // visible height
    const visibleHeight = $messages.offsetHeight;

    // height of messages container
    const containerHeight = $messages.scrollHeight;

    // how far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight;

    // Pad the space to account for rounding errors in measure & user not "fully" scrolling down.
    const scrolledToTheBottomZone = 10
    if(containerHeight - newMessageHeight <= scrollOffset + scrolledToTheBottomZone) {
        $messages.scrollTop = $messages.scrollHeight;
    }
};

socket.on('message', (message) => {
    console.log(message);
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('hh:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('locationMessage', (message) => {
    console.log(message);
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('hh:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('roomData', ({ room, users }) => {
    console.log(room, users);
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });

    $sidebar.innerHTML = html;
});

$messageForm.addEventListener('submit', function(e) {
    e.preventDefault();

    // disabled
    $messageFormButton.setAttribute('disabled', 'disabled');

    const message = e.target.elements.message.value;
    socket.emit('sendMessage', message, (error) => { // set acknowledgement fn
        // enabled
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();

        if(error) {
           return console.log(error);
        }

        console.log('The message was delivered');
    });
});

$sendLoationButton.addEventListener('click', function() {
    if(!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.');
    }
    
    $sendLoationButton.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            $sendLoationButton.removeAttribute('disabled');
            console.log('Location shared!');
        });
    })
    
});


socket.emit('join', { username, room }, (error) => {
    if(error) {
        alert(error);
        location.href = '/'; // redirect
    }
});