const socket = io(); // 자동으로 connect

const welcome = document.getElementById('welcome');
const welcomeForm = welcome.querySelector('form');
const room = document.getElementById('room');

room.hidden = true;

let roomName;
let myNickName;

function addMessage(message) {
  const ul = room.querySelector("ul");
  const li = document.createElement("li");
  li.innerText = message;
  ul.appendChild(li);
}

function handleMessageSubmit(event) {
  event.preventDefault();

  const input = room.querySelector("#msg input");
  const value = input.value;

  socket.emit("new_message", input.value, roomName, () => {
    addMessage(`You: ${value}`);
  });
  input.value = '';
}

// function handleNicknameSubmit(event) {
//   event.preventDefault();

//   const input = room.querySelector("#name input");
//   const value = input.value;
//   socket.emit("nickname", value);
// }

function showRoom(msg) {
  welcome.hidden = true;
  room.hidden = false;
  const h3 = room.querySelector("h3");
  const nickNameTag = room.querySelector("span#nickName");
  h3.innerText = `Room ${roomName}`;
  nickNameTag.innerText = myNickName;

  const msgForm = room.querySelector("form#msg");
  // const nameForm = room.querySelector("form#name");
  msgForm.addEventListener("submit", handleMessageSubmit);
  // nameForm.addEventListener("submit", handleNicknameSubmit)
}

function handleRoomSubmit(event) {
  event.preventDefault();
  const roomNameInput = welcomeForm.querySelector('input#roomName');
  const nickNameInput = welcomeForm.querySelector('input#nickName')
  // object를 보낼 수 있다
  socket.emit('nickname', nickNameInput.value);

  socket.emit('enter_room', roomNameInput.value, showRoom);
  roomName = roomNameInput.value;
  myNickName = nickNameInput.value;

  roomNameInput.value = '';
  nickNameInput.value = '';
}

welcomeForm.addEventListener('submit', handleRoomSubmit);

socket.on("welcome", (user, newCount) => {
  addMessage(`${user} joined! (${newCount})`);
})

socket.on("bye", (left, newCount) => {
  addMessage(`${left} left! (${newCount})`);
})

socket.on("new_message", msg => {
  addMessage(msg);
})

socket.on("room_change", (rooms) => {
  console.log('rooms', rooms);
  const roomList = welcome.querySelector('ul');
  if (rooms.length === 0) {
    roomList.innerText = "";
    return;
  }

  rooms.forEach(room => {
    const li = document.createElement('li');
    li.innerText = room;
    roomList.appendChild(li);
  })
})