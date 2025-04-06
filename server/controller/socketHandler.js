
const rooms = {};

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

export function socketHandler(io){
    io.on('connection', (socket) => {
        console.log('🟢 an user connected');

        socket.on('disconnect', () => {
            console.log('🔴 an user disconnect');
            for (const roomCode in rooms) {
                const room = rooms[roomCode];
                const participantIndex = room.participants.findIndex((participant) => participant.id === socket.id);
        
                if (participantIndex !== -1) {
                   
        
                    console.log(`User ${socket.id} removed from room ${roomCode}`);
                    const name = room.participants[participantIndex].name;
                    room.participants.splice(participantIndex, 1);
                    io.to(roomCode).emit('userLeft', {name:name, participants: room.participants });
                    

                    if (room.participants.length === 0) {
                        delete rooms[roomCode];
                        console.log(`Room ${roomCode} deleted because it is empty`);
                    }
                    break;
                }
                
            }
        });

        socket.on('createRoom', () => {
            let newRoomCode;
            do {
                newRoomCode = generateRoomCode();
            } while (rooms[newRoomCode]);
        
            rooms[newRoomCode] = {
              hostSocketId: socket.id,
              participants: [],
              messages: [],
            };
        
            socket.join(newRoomCode);
            console.log(`Room created: ${newRoomCode} by ${socket.id}`);
            socket.emit('roomCreated', {roomCode: newRoomCode, hostId: socket.id}, newRoomCode);
        });
        socket.on('joinRoom', ({roomCode, name}) => {
            if (rooms[roomCode]) {
                socket.join(roomCode);
                rooms[roomCode].participants.push({id:socket.id, name:name});
                console.log(`User ${socket.id} joined room ${roomCode}`);
                console.log('Room participants:', rooms[roomCode]);
                io.to(roomCode).emit('userJoined', {participants: rooms[roomCode].participants, userId: socket.id});
            } else {
                socket.emit('error', 'Room not found');
            }
        });
        socket.on('sendMessage', ({message, roomCode, name}) => {
            if (rooms[roomCode]) {
                rooms[roomCode].messages.push({message:message, sender: {id:socket.id, name:name}});
                io.to(roomCode).emit('receiveMessage', {message, sender: {id:socket.id, name:name}});
            } else {
                socket.emit('error', 'Room not found');
            }
        });
    });
}