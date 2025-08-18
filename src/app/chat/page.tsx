"use client";

import { Suspense } from "react";
import { useEffect, useState, useRef } from "react";
import AuthGuard from "../../lib/components/AuthGuard";
import { useAppContext } from "@/lib/context/useAppContext";
import { useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import { IChat, IMessage } from "@/lib/models/chat";
import { onSnapshot, query, collection, getFirestore, orderBy } from "firebase/firestore";
import { getFirebaseApp } from "@/lib/firebase/client";

// Keep the useWindowSize hook as is
function useWindowSize() {
    const [windowSize, setWindowSize] = useState<any>({});
  
    useEffect(() => {
      function handleResize() {
        if (typeof window !== 'undefined') {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
            }
      }

      if (typeof window !== 'undefined') {
        setWindowSize({
            width: window.innerWidth,
            height: window.innerHeight,
        });
      }
  
      window.addEventListener('resize', handleResize);
  
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }, []);
  
    return windowSize;
  }
  
function Chat() {
    const searchParams = useSearchParams();
    const chatUserId = searchParams.get("chatUserId");
    const [chats, setChats] = useState<IChat[]>([]);
    const [selectedChat, setSelectedChat] = useState<IChat | null>(null);
    const { user: authUser } = useAppContext();

    // Effect to find or create a chat when chatUserId is present
    useEffect(() => {
        const findOrCreateChat = async () => {
            if (!chatUserId || !authUser) return;
            Swal.showLoading();
            try {
                const response = await fetch('/api/create-chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ authUserId: authUser.id, chatUserId }),
                });

                if (!response.ok) {
                    throw new Error('Failed to create or find chat');
                }

                const { chat } = await response.json();
                setSelectedChat(chat);
            } catch (error) {
                console.error(error);
                Swal.fire({
                    title: "Error",
                    text: "Failed to create chat",
                    icon: "error",
                });
            } finally {
                Swal.close();
            }
        };
        findOrCreateChat();
    }, [chatUserId, authUser]);

    // Effect to fetch all of the user's chats
    useEffect(() => {
        const fetchChats = async () => {
            if (!authUser) return;
            try {
                const response = await fetch(`/api/get-chats?userId=${authUser.id}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch chats');
                }
                const { chats } = await response.json();
                const sortedChats = chats.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
                setChats(sortedChats);
            } catch (error) {
                console.error("Failed to fetch chats:", error);
            }
        };
        fetchChats();

        // Optional: Add a realtime listener for chat list updates if needed
        // This is more complex and may not be required for MVP.
        // For now, we rely on the initial fetch. The list will update on page refresh.

    }, [authUser]);

    const handleSelectChat = (chat: IChat) => {
        setSelectedChat(chat);
    }

    const handleBack = () => {
        setSelectedChat(null);
    }

    return (
        <>
            <AuthGuard>
            <div className="chat-container">
                <ChatSidebar chats={chats} authUser={authUser} handleSelectChat={handleSelectChat} selectedChat={selectedChat} />
                <ChatWindow selectedChat={selectedChat} authUser={authUser} handleBack={handleBack} />
            </div>
            </AuthGuard>
        </>
    )
}

function ChatSidebar({ chats, authUser, handleSelectChat, selectedChat }: { chats: IChat[], authUser: any, handleSelectChat: (chat: IChat) => void, selectedChat: IChat | null }) {
    const { width } = useWindowSize();
    return (
        <div className={`chat-sidebar ${selectedChat && width < 768 ? "hidden" : ""}`}>
            <div className="chat-sidebar-header">
                <i className="la la-arrow-left" onClick={() => window.location.href = "/matches"} style={{ cursor: "pointer" }}></i>
                <h3>Chats</h3>
            </div>
            {chats.length > 0 ? (
                <div className="chat-sidebar-body">
                    {chats.map((chat) => (
                        <ChatSidebarItem key={chat.id} chat={chat} authUser={authUser} handleSelectChat={handleSelectChat} />
                    ))}
                </div>
            ) : (
                <div className="chat-sidebar-body" style={{ margin: "0 auto", textAlign: "center", padding: "20px" }}>
                    <h3>No chats found</h3>
                    <p>Find someone you like and start a chat</p>
                </div>
            )}
        </div>
    )
}

function ChatSidebarItem({ chat, authUser, handleSelectChat }: { chat: IChat, authUser: any, handleSelectChat: (chat: IChat) => void }) {
    const [chatUser, setChatUser] = useState<any>(null);

    useEffect(() => {
        const chatUserId = Object.keys(chat.members).find((key: any) => key !== authUser.id);
        if (chatUserId) {
            setChatUser(chat.members[chatUserId]);
        }
    }, [chat, authUser?.id]);
    
    // The last message is now directly available on the chat object
    const lastMessage = chat.lastMessage;

    return (
        <div className="chat-sidebar-item" key={chat.id} onClick={() => handleSelectChat(chat)}>
            <div className="chat-sidebar-item-avatar">
                <img src={chatUser?.profilePicture || null} alt={chatUser?.name || ""} />
            </div>
            <div className="chat-sidebar-item-info">
                <span>{chatUser?.name || ""}</span>
                <span>{lastMessage?.text || "No messages yet"}</span>
                <span>{lastMessage?.createdAt ? new Date(lastMessage.createdAt as any).toLocaleString() : ""}</span>
            </div>
        </div>
    )
}

function ChatWindow({ selectedChat, authUser, handleBack }: { selectedChat: IChat | null, authUser: any, handleBack: () => void }) {
    const [chatUser, setChatUser] = useState<any>(null);
    const [messages, setMessages] = useState<IMessage[]>([]);
    const [message, setMessage] = useState<string>("");
    const { width } = useWindowSize();
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    // Effect to get the other user's data from the selected chat
    useEffect(() => {
        if (!selectedChat || !authUser) return;
        const chatUserId = Object.keys(selectedChat.members).find((key: any) => key !== authUser.id);
        if (chatUserId) {
            setChatUser(selectedChat.members[chatUserId]);
        }
    }, [selectedChat, authUser]);

    // Effect for real-time message updates
    useEffect(() => {
        if (!selectedChat) return;
        
        const firebaseApp = getFirebaseApp();
        const db = getFirestore(firebaseApp);
        const messagesRef = collection(db, "chats", selectedChat.id, "messages");
        const q = query(messagesRef, orderBy("createdAt", "asc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newMessages: IMessage[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            } as IMessage));
            setMessages(newMessages);
        });

        return () => unsubscribe();
    }, [selectedChat]);

    // Effect to scroll to the bottom of the messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!message.trim() || !selectedChat) return;

        try {
            await fetch('/api/send-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatId: selectedChat.id,
                    senderId: authUser.id,
                    text: message,
                }),
            });
            setMessage("");
        } catch (error) {
            console.error("Failed to send message:", error);
            Swal.fire("Error", "Failed to send message", "error");
        }
    };

    if (!selectedChat) {
        return (
            <div className="chat-window-unselected">
                <h3>Select a chat to start messaging</h3>
            </div>
        )
    }

    return (
        <div className="chat-window">
            <div className="chat-window-container">
                <div className="chat-window-header">
                    {width < 768 && <i className="la la-arrow-left" onClick={handleBack} style={{ cursor: "pointer" }}></i>}
                    <img src={chatUser?.profilePicture} alt={chatUser?.name} />
                    <h3 style={{ color: "#fff" }}>{chatUser?.name}</h3>
                </div>
                <div className="chat-window-messages">
                    {messages.map((msg) => (
                        <div className={`chat-window-message ${msg.senderId === authUser.id ? "right" : ""}`} key={msg.id}>
                             <div className="chat-window-message-avatar">
                                <img src={selectedChat.members?.[msg.senderId]?.profilePicture} alt={selectedChat.members?.[msg.senderId]?.name} />
                            </div>
                            <div className="chat-window-message-content">
                                <span>{msg.text}</span>
                                <span>{msg.createdAt ? new Date(msg.createdAt as any).toLocaleString() : ""}</span>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <div className="chat-window-input">
                    <input id="message-input" type="text" className="form-control" placeholder="Type your message here..." value={message} onChange={(e) => setMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} />
                    <button className="btn btn-primary" style={{ margin: 0 }} onClick={handleSendMessage}>Send</button>
                </div>
            </div>
        </div>
    )
}

export default function ChatPageWithSuspense() {
  return (
    <Suspense>
      <Chat />
    </Suspense>
  );
}