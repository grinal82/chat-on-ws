import "./css/style.css";

// Элементы pop-up
const usernameForm = document.getElementById("usernameForm");
const usernameInput = document.getElementById("usernameInput");
const popupError = document.getElementById("popupError");
const popup = document.getElementById("popup");

// Элементы чата
const peopleList = document.getElementById("plist");
const chatSpace = document.getElementById("chat");
const sendMessageBtn = document.getElementById("send");
let userListHTML = "";

// Функция отображения pop-up
function showPopup() {
  popup.style.display = "flex";
}

// Функция скрытия the pop-up window
function hidePopup() {
  popup.style.display = "none";
}

const ws = new WebSocket("ws://localhost:7070");

// Обработчик отправки псевдонима на сервер
usernameForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const username = usernameInput.value.trim();
  if (!username) {
    popupError.textContent = "Username cannot be empty";
    return;
  }

  // Отправка username на сервер
  ws.send(JSON.stringify({ type: "username", username }));

  ws.username = usernameInput.value.trim();
});

// отправка содержимого формы на сервер
sendMessageBtn.addEventListener("click", function (event) {
  event.preventDefault();
  let chatMessage = document.getElementById("chat-message");
  let message = chatMessage.value;
  if (!message) {
    return;
  }
  let created = new Date().toLocaleDateString();
  let time = new Date().toLocaleTimeString();
  ws.send(
    JSON.stringify({
      type: "message",
      message: message,
      created: created,
      time: time,
    })
  );
  chatMessage.value = "";
});

// Listeners на различные события websocket'a
ws.addEventListener("open", (e) => {
  // console.log(e);
  console.log("ws open");
});

ws.addEventListener("close", (e) => {
  console.log(e);
  console.log("ws close");
});

ws.addEventListener("error", (e) => {
  console.log(e);
  console.log("ws error");
});

// Обработка полученных сообщенийы
ws.onmessage = (incomingMessage) => {
  console.log(incomingMessage);
  try {
    const data = JSON.parse(incomingMessage.data);
    if (data.type === "usernameValidation") {
      const { isValid, message, username } = data;
      if (isValid) {
        ws.username = username;
        hidePopup();
        userListHTML += `
        <li class="clearfix">
          <div class="about">
            <div class="name">${ws.username}</div>
            <div class="status"> <i class="fa fa-circle online"></i> online </div>
          </div>
        </li>
      `;
        peopleList.innerHTML = `
        <ul class="list-unstyled chat-list mt-2 mb-0">
          ${userListHTML}
        </ul>
      `;
      } else {
        popupError.textContent = message;
      }
    } else if (data.type === "initialData") {
      // Обработчик истории чата
      const { chatHistory, activeUsernames } = data;
      chatSpace.innerHTML = ""; // Очистка chat space чтобы избежать задвоения
      peopleList.innerHTML = "";
      // let activeUsers = activeUsernames;

      // Включение юзеров в userListHTML
      userListHTML = activeUsernames
        .filter((user) => user !== ws.username) // Отфильтровывание ника текущего юзера
        .map((user) => {
          return `
            <li class="clearfix">
              <div class="about">
                <div class="name">${user}</div>
                <div class="status"> <i class="fa fa-circle online"></i> online </div>
              </div>
            </li>
          `;
        })
        .join("");

      // Добавить username текущего юзера в userListHTML
      userListHTML += `
        <li class="clearfix">
          <div class="about">
            <div class="name">${ws.username}</div>
            <div class="status"> <i class="fa fa-circle online"></i> online </div>
          </div>
        </li>
      `;

      peopleList.innerHTML = `
        <ul class="list-unstyled chat-list mt-2 mb-0">
          ${userListHTML}
        </ul>
      `;
      // Обработка и загрузка истории чата
      const chatHistoryData = JSON.parse(chatHistory);
      console.log(chatHistoryData);
      const chatHistoryMessages = chatHistoryData.chat;
      chatHistoryMessages.forEach((val) => {
        const message = val.message;
        const time = val.time;
        const created = val.created;
        let isCurrentUser = val.username === ws.username;
        chatSpace.innerHTML += `
        <li class="clearfix">
          <div class="${
            isCurrentUser ? "message-data text-right" : "message-data text-left"
          }">
            <span class="message-data-time">${
              val.username
            },${time}, ${created}</span>
          </div>
          <div class="message ${
            isCurrentUser
              ? "other-message float-right"
              : "other-message float-left"
          }">${message}</div>
        </li>`;
      });
    } else {
      // Обработчик real-time сообщений
      const { username, message, created, time } = data;
      const isCurrentUser = username === ws.username;
      chatSpace.innerHTML += `
        <li class="clearfix">
          <div class="${
            isCurrentUser ? "message-data text-right" : "message-data text-left"
          }">
            <span class="message-data-time">${username}, ${time}, ${created}</span>
            <img src="https://bootdey.com/img/Content/avatar/avatar7.png" alt="avatar">
          </div>
          <div class="message ${
            isCurrentUser
              ? "other-message float-right"
              : "other-message float-left"
          }">${message}</div>
        </li>`;
    }
  } catch (error) {
    console.error("Error parsing incoming message data:", error);
  }
};

// Event listener который показывает pop-up window по событию page load
window.addEventListener("load", showPopup);
