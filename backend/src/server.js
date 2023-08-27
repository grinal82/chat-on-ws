const http = require("http");
const Koa = require("koa");
const cors = require("@koa/cors");
const bodyParser = require("koa-bodyparser");
const WS = require("ws");
const { v4: uuidv4 } = require("uuid");

const app = new Koa();

app.use(cors());
app.use(bodyParser());

const port = process.env.PORT || 7070;
const server = http.createServer(app.callback());
const wsServer = new WS.Server({
  server,
});

const clients = {};
const chat = [];
const usernames = new Set();

wsServer.on("connection", (ws) => {
  const chatHistory = JSON.stringify({ type: "chat", chat });
  const activeUsernames = Array.from(usernames);
  ws.send(
    JSON.stringify({
      type: "initialData",
      chatHistory,
      activeUsernames,
    })
  );

  ws.on("message", (rawMessage) => {
    const { type, username, message, created, time } = JSON.parse(rawMessage);
    if (type === "username") {
      // Валидируем username
      if (usernames.has(username)) {
        // Username уже существует, отправляем validation response
        ws.send(
          JSON.stringify({
            type: "usernameValidation",
            isValid: false,
            message: "Username already taken",
          })
        ); 
      } else {
        // Username валиден, сохраняем его в WebSocket client object и добавляем в Set usernames
        ws.username = username;
        usernames.add(username);
        ws.send(
          JSON.stringify({
            type: "usernameValidation",
            isValid: true,
            username,
          })
        );
      }
    } else if (type === "message") {
      // Пушим сообщение в массив для хранения
      chat.push({ username: ws.username, message, created, time });
      // Передаем сообщение всем подключенным клиентам
      Array.from(wsServer.clients)
        .filter((client) => client.readyState === WS.OPEN)
        .forEach((client) =>
          client.send(
            JSON.stringify({
              type: "message",
              username: ws.username,
              message,
              created,
              time,
            })
          )
        );
    }
  });

  ws.on("close", () => {
    delete clients[id];
    if (ws.username) {
      // Удаляем юзернеймы при отключении
      usernames.delete(ws.username);
    }
    console.log(`client with ${ws.username} closed`);
  });
});

server.listen(port, (err) => {
  if (err) {
    console.log(err);
    return;
  }

  console.log("Server is listening to port: " + port);
});
