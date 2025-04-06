import { useState, useEffect } from 'react'
import {socket } from '../config/socket'
import { useNavigate } from 'react-router-dom';

function Home() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [joinMode, setJoinMode] = useState<boolean>(false);
    const [roomCode, setRoomCode] = useState<string>('');

    useEffect(() => {
        if (socket.connected) {
            console.log('Socket is already connected!');
            setIsLoading(false);
        }

        const onConnect = () => {
          console.log('Connected to server!');
          setIsLoading(false);
        };
    
        const onDisconnect = () => {
          console.log('Disconnected from server');
        };

        const onRoomCreated = (data: {roomCode:string, hostId:string}) => {
            console.log('Your Room Was Created!');
            console.log(data);
            navigate('/chat/'+ data.roomCode);
          };
    
        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('roomCreated', onRoomCreated);
    
        return () => {
          socket.off('connect', onConnect);
          socket.off('disconnect', onDisconnect);
          socket.off('roomCreated', onRoomCreated);
        };
      }, []);

    function createRoom(){
        console.log('Creating room...')
        socket.emit('createRoom');
    }

  return (
    <div className="bg-chocolate-cosmos-100 h-svh w-screen flex flex-col justify-center items-center text-white">
        {isLoading ? <h1>Loading...</h1> : 
            <>
                <div className="flex flex-row"><p className='text-redwood-500 text-4xl md:text-6xl lg:text-7xl'>Chat</p><span className="text-apricot-500 text-4xl md:text-6xl lg:text-7xl">Now</span></div>
                <div className="flex flex-col gap-4 mt-4">
                    {
                      !joinMode ? 
                        <div className="flex flex-col items-center gap-6 w-full max-w-md">
                        <p className="text-lg md:text-xl font-semibold text-center">
                          Start a chat, share the room, and that’s it.
                        </p>
                        <button 
                          className="bg-redwood-500 w-full px-6 py-3 text-center rounded-lg text-lg md:text-2xl hover:bg-redwood-400 transition-colors duration-150 cursor-pointer" 
                          onClick={() => createRoom()}
                        >
                          Create Room
                        </button>
                        <button 
                          className="bg-redwood-500 w-full px-6 py-3 text-center rounded-lg text-lg md:text-2xl hover:bg-redwood-400 transition-colors duration-150 cursor-pointer" 
                          onClick={() => setJoinMode(true)}
                        >
                          Join Room
                        </button>
                        </div>
                      :
                        <div className="flex flex-col items-center gap-4 w-full max-w-md">
                        <p className="text-lg font-semibold">Enter Room Code</p>
                        <input 
                          autoComplete="off" 
                          value={roomCode} 
                          onChange={e => setRoomCode(e.target.value.toUpperCase())} 
                          type="text" 
                          className="border-2 border-redwood-500 outline-none rounded-md p-2.5 text-xl w-full text-center"
                        />
                        <button 
                          className="bg-redwood-500 w-full px-4 py-2 text-center rounded-md text-xl hover:bg-redwood-400 transition-colors duration-150 cursor-pointer"  
                          onClick={() => navigate('/chat/' + roomCode)}
                        >
                          Join
                        </button>
                        <button 
                          className="bg-gray-500 w-full px-4 py-2 text-center rounded-md text-xl hover:bg-gray-400 transition-colors duration-150 cursor-pointer" 
                          onClick={() => setJoinMode(false)}
                        >
                          Return
                        </button>
                        </div>
                    }
                </div>
            </>
        }
        
    </div>
  )
}

export default Home