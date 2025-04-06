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
                <h1 className="text-redwood-500">Chat<span className="text-apricot-500">Now</span></h1>
                <div className="flex flex-col gap-4 mt-4">
                    {
                      !joinMode ? 
                      <>
                        <button className="bg-redwood-500 px-3 py-1 text-center rounded-sm text-2xl hover:bg-redwood-400 transition-colors duration-100 cursor-pointer" onClick={()=>createRoom()}>Create</button>
                        <button className="bg-redwood-500 px-3 py-1 text-center rounded-sm text-2xl hover:bg-redwood-400 transition-colors duration-100 cursor-pointer" onClick={()=>setJoinMode(true)}>Join</button>
                      </>
                      :
                      <>
                        <p>Room code</p>
                        <input autoComplete="off" value={roomCode} onChange={e=>setRoomCode(e.target.value.toUpperCase())} type="text" className='border-red-500 border-2 outline-0 rounded-sm p-2.5 text-3xl' />
                        <button className='bg-redwood-500 px-3 py-1 text-center rounded-sm text-2xl hover:bg-redwood-400 transition-colors duration-100 cursor-pointer'  onClick={()=>navigate('/chat/'+ roomCode)}>Join</button>
                        <button className='bg-redwood-500 px-3 py-1 text-center rounded-sm text-2xl hover:bg-redwood-400 transition-colors duration-100 cursor-pointer' onClick={()=>setJoinMode(false)}>Return</button>
                      </>
                    }
                </div>
            </>
        }
        
    </div>
  )
}

export default Home