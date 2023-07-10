const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

 const objectData = require('./json/data1.json');

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

function convertData(){
	const newData = objectData.map((data)=>{
		return {time:new Date(data[0]).valueOf(), value:data[1]/1000};
	})
	return newData;
}

const data = convertData();

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  const data_len = data.length;
  let i = 0;

  setInterval(() => {
    if(i<data_len){
      socket.emit('receive_data', data[i]);
      i++;
    }
    else {
      clearInterval();
    }
  },300);
});

server.listen(3001, () => {
  console.log("SERVER IS RUNNING");
});