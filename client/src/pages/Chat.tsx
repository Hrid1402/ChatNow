import { Link, useParams } from "react-router-dom"
import Swal from 'sweetalert2'
import {socket } from '../config/socket'
import {useEffect, useRef, useState } from "react"
import QRCode from "qrcode"
import icon_send from '../assets/send.svg'
import icon_exit from '../assets/exit.svg'
import icon_qr from '../assets/qr.svg'

function Chat() {
    const {id} = useParams<{id: string}>()
    const qrCode_image = useRef(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const [showQr, setShowQr] = useState<boolean>(false);
    const [showRoomInf, setShowRoomInf] = useState<boolean>(true);
    const currentUrl:string = window.location.href;
    const [messageContent, setMessageContent] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);
    const [username, setUsername] = useState<string>('');
    const [participants, setParticipants] = useState<{id:string, name:string}[]>([]);
    const [messages, setMessages] = useState<{content: string, sender: {id:string, name:string}}[]>([]);

    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            console.log('Scrolling to bottom...');
            messagesContainerRef.current.scrollTo({
            top: messagesContainerRef.current.scrollHeight,
            behavior: 'smooth',
            });
        }
    }
    function sendMessage(){
        if(messageContent.trim() === '') return;
        console.log('Sending message: '+ messageContent);
        socket.emit('sendMessage', {message: messageContent, roomCode: id, name: username});
        setMessageContent('');
    }
    function generateQRCode() {
        if (qrCode_image.current) {
            QRCode.toCanvas(qrCode_image.current, currentUrl, { width: 200 }, function (error: Error | null | undefined) {
                if (error) {
                    console.error(error);
                    return;
                }
                console.log('QR code generated!');
            });
        }
    }

     async function joinProcess(){
        let name = 'Anonymous';
        const result = await Swal.fire({
            title: 'Enter your name',
            input: 'text',
            inputPlaceholder: 'Your name here...',
            inputAttributes: {
            maxlength: '20',
            },
            confirmButtonColor: '#8e2e39',
            showCancelButton: false,
            allowOutsideClick: false,
            allowEscapeKey: false,
            inputValidator: (value) => {
            if (!value.trim()) {
                return 'Name cannot be empty!';
            }
            return null;
            },
        })
        
        if(result.value !== undefined){
            name = result.value;
        }
        setUsername(name);
        socket.emit('joinRoom', {roomCode:id, name:name});
    }
    useEffect(()=>{
        
        if (socket.connected) {
            console.log('Socket is already connected!');
            setIsLoading(false);
            if(username === ''){
                joinProcess();
            }
            
        }
        
        const onConnect = () => {
          console.log('Connected to server!');
          setIsLoading(false);
          if(username === ''){
            joinProcess();
            }
        };

        const onUserLeft = (data:{name:string, participants:{id:string, name:string}[]}) => {
            console.log('Disconnected from server');
            setMessages(prev=>[...prev, {content: `'${data.name}' left the chat.`, sender: {id:'system', name:'system'}}]);
            setParticipants(data.participants);
        };

        const onError = () => {
            console.log('Room not found');
            setError(true);
        };

        const onUserJoined = (data: {participants:{id:string, name:string}[], userId: string}) => {
            if(data.userId === socket.id){
                console.log('You joined the room!');
                generateQRCode();
            }else{
                console.log('User joined room');
            }
            setMessages(prev=>[...prev, {content: `'${data.participants[data.participants.length-1].name}' joined the chat!`, sender: {id:'system', name:'system'}}]);
            setParticipants(data.participants); 
            
        };

        const onMessage = (data: {message: string, sender:{id:string, name:string}}) => {
            console.log('Message received: '+ data.message);
            setMessages(prev => {
            const updatedMessages = [...prev, {content: data.message, sender: data.sender}];
            setTimeout(scrollToBottom, 0);
            return updatedMessages;
            });
        }


        socket.on('connect', onConnect);
        socket.on('userLeft', onUserLeft);
        socket.on('error', onError);
        socket.on('userJoined', onUserJoined);
        socket.on('receiveMessage', onMessage);
    
        return () => {
          socket.off('connect', onConnect);
          socket.off('userLeft', onUserLeft);
          socket.off('error', onError);
          socket.off('userJoined', onUserJoined);
          socket.off('receiveMessage', onMessage);
        };
        
    },[username])
    if(error){
        return(
            <div className="bg-chocolate-cosmos-100 h-svh w-screen flex flex-col justify-center items-center text-white">
                <h1>Room not found</h1>
                <Link to={'/'} className="mt-10 bg-redwood-400 rounded-sm px-2 py-1 text-3xl">Go home</Link>
            </div>
        )
    }

    function linkify(text:string) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.replace(urlRegex, '<a class="text-amber-200  font-medium" href="$1" target="_blank">$1</a>');
      }

    return (
    <div className="min-[500px]:px-10 px-5 py-5 bg-chocolate-cosmos-100 h-svh w-screen flex flex-col justify-center items-center text-white">
        {
            isLoading ? <h1>Loading...</h1> :
            <>
                {
                    showRoomInf &&
                    <>
                        <h2 className="sm:text-4xl text-3xl"><span className="text-redwood-600 font-medium">Room code:</span> {id}</h2>
                        <div className="flex flex-col min-[360px]:flex-row items-center gap-2 justify-center mb-2 w-full max-w-[500px] py-1.5 px-0.5">
                            <button 
                                className="sm:text-2xl text-sm relative w-full min-[400px]:w-auto m-2.5 bg-amber-100 text-chocolate-cosmos-100 px-3 py-1.5 rounded-sm cursor-pointer text-center" 
                                onClick={() => {
                                    navigator.clipboard.writeText(currentUrl);
                                    const notification = document.createElement('div');
                                    notification.textContent = 'Copied!';
                                    notification.className = 'absolute top-[-1.5rem] right-0 bg-redwood-500 text-white text-xs px-2 py-1 rounded-sm';
                                    const button = document.activeElement;
                                    button?.appendChild(notification);
                                    setTimeout(() => {
                                        notification.remove();
                                    }, 2000);
                                }}
                            >
                                {'Click to copy your chat link'}
                            </button>
                            <button 
                                className="select-none size-7 flex items-center justify-center cursor-pointer" 
                                onClick={() => setShowQr(prev => !prev)}
                            >
                                <img src={icon_qr} alt="qr code" />
                            </button>
                        </div>
                    </>
                }
                    <div className="flex flex-row gap-3">
                        <a href={'/'} 
                            className="bg-redwood-400 text-white px-2 py-1 mb-2 rounded-sm text-sm sm:text-lg hover:bg-redwood-500 transition-colors flex items-center gap-1"><img className="size-5" src={icon_exit} alt="" />Left Room</a>
                        {
                            showRoomInf ? <button className="bg-redwood-400 text-white px-2 py-1 mb-2 rounded-sm text-sm sm:text-lg hover:bg-redwood-500 transition-colors flex items-center hover:cursor-pointer" onClick={()=>{setShowRoomInf(false), setShowQr(false)}}>Hide Room Info</button>:
                            <button className="bg-redwood-400 text-white px-2 py-1 mb-2 rounded-sm text-sm sm:text-lg hover:bg-redwood-500 transition-colors flex items-center hover:cursor-pointer" onClick={()=>setShowRoomInf(true)}>Show Room Info</button>
                        }
                    </div>
                    <div className={`${showQr ? 'flex' : 'hidden'} flex-col items-center justify-center mb-4 w-[500px] py-1.5 px-0.5`}>
                        <canvas ref={qrCode_image}></canvas>
                    </div>
                
                <h2 className="mb-2 font-medium sm:text-3xl text-2xl">Participants ({participants.length})</h2>
                <button className="mb-1 cursor-pointer bg-redwood-200 px-3 text-center rounded-sm text-2xl ring-amber-50 ring-1">
                    {username}
                </button>
                <div
                    className="flex flex-row gap-2 mb-4 w-full max-w-[500px] overflow-x-auto py-1.5 px-0.5
                        [&::-webkit-scrollbar]:h-2
                        [&::-webkit-scrollbar-thumb]:bg-redwood-500
                    "
                >
                    {participants.map((p, i) => {
                        if (p.id === socket.id) return null;
                        return (
                            <div
                                key={i}
                                className="bg-redwood-500 px-3 py-1 text-center rounded-sm text-lg sm:text-2xl ring-amber-50 ring-1 text-nowrap"
                            >
                                {p.name}
                            </div>
                        );
                    })}
                </div>
                <div className="w-full flex flex-col max-w-[500px] bg-redwood-900 rounded-sm flex-1 overflow-hidden">
                    <div ref={messagesContainerRef} className="flex flex-1 flex-col gap-2 p-4 overflow-y-auto 
                        [&::-webkit-scrollbar]:w-1.5
                        [&::-webkit-scrollbar-thumb]:bg-redwood-500
                    ">
                        {
                            messages.map((m, i) => {
                                const notMe = m.sender.id !== socket.id;
                                const prevMessageSame = messages[i-1]?.sender.id === m.sender.id;
                                if(m.sender.id === 'system'){
                                    return(
                                        <div key={i} className="self-center bg-red-400 px-3 py-1.5 rounded-sm break-words break-all">
                                            <p className="font-medium">{m.content}</p>
                                        </div>
                                    )
                                }
                                return(
                                    <div className="flex flex-col" key={i}>
                                        {
                                            !prevMessageSame && 
                                            <p className={`${notMe ? 'text-start' : 'text-end'} text-amber-950`}>{m.sender.name}</p>
                                        }
                                        <div  className={`${notMe ? 'self-start bg-red-400' : 'self-end bg-red-500'}   px-3 py-1.5 rounded-sm break-words break-all text-start`}>
                                            <p dangerouslySetInnerHTML={{ __html: linkify(m.content) }}></p>
                                    </div>
                                    </div>
                                    
                                )
                            })

                        }
                    </div>
                    <div className="flex flex-row items-center bg-amber-50 ">
                        <input autoComplete="off"
                            placeholder="Type your message..."
                            onChange={e => setMessageContent(e.target.value)} 
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    sendMessage();
                                }
                            }} 
                            type="text"
                            value={messageContent} 
                            className="px-4 py-3 text-xl sm:text-2xl w-full box-border  outline-0 text-chocolate-cosmos-100" 
                        />
                        <button 
                            className="flex items-center justify-center text-chocolate-cosmos-100 size-10 mr-2 cursor-pointer" 
                            onClick={() => sendMessage()}
                        ><img src={icon_send} alt="send button" className='select-none h-full w-full'/></button>
                    </div>
                </div>
            </>
        }
    </div>
  )
}

export default Chat