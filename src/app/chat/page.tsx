"use client";

import { useEffect, useState } from "react";
import AuthGuard from "../../lib/components/AuthGuard";
import { useAppContext } from "@/lib/context/useAppContext";
import { arrayUnion, collection, doc, documentId, getDocs, getFirestore, onSnapshot, query, addDoc, Timestamp, updateDoc, where, getDoc } from "firebase/firestore";
import { getFirebaseApp } from "../../lib/firebase/client";
import { guid } from "../../lib/utils/utils";
import { useSearchParams } from "next/navigation";
import Swal from "sweetalert2";

export interface UserChat {
    id: string;
    memberIds: string[];
    members: Record<string, any>;
    messages: any[];
    updatedAt: any;
}

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
  
      // Clean up the event listener when the component unmounts
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }, []); // Empty dependency array ensures the effect runs only once on mount
  
    return windowSize;
  }
  

export default function Chat() {
    const searchParams = useSearchParams();
    const chatUserId = searchParams.get("chatUserId");
    const [chats, setChats] = useState<UserChat[]>([]);
    const [selectedChatId, setSelectedChatId] = useState<string>("");
    const {user: authUser} = useAppContext();

    useEffect(() => {
        const createNewChat = async () => {
            if (!chatUserId || !authUser) return;
           try {
            const firebaseApp = getFirebaseApp();
            const db = getFirestore(firebaseApp);
            // Check if chat already exists
            const memberIds = [authUser.id, chatUserId].sort();
            Swal.showLoading();
            const filter = query(collection(db, "chats"), where("memberIds", "==", memberIds));
            const chatDocs = await getDocs(filter);
            if (chatDocs.docs.length > 0) {
                console.log("Chat already exists");
                // Chat already exists
                setSelectedChatId(chatDocs.docs[0].id);
                Swal.close();
            } else {
                console.log("Chat does not exist");
                const userRef = doc(db, "users", chatUserId);
                const userDoc = await getDoc(userRef);
                if (!userDoc.exists()) {
                    throw new Error("User does not exist");
                }
                const chatUserData = userDoc.data();
                console.log(chatUserData);
                // Create new chat
                const chat = await addDoc(collection(db, "chats"), {
                    members: {
                        [authUser.id]: {
                            name: authUser.name,
                            profilePicture: authUser.profilePicture,
                        },
                        [chatUserId]: {
                            name: chatUserData.name,
                            profilePicture: chatUserData.profilePicture,
                        },
                    },
                    memberIds: memberIds,
                    messages: [],
                    updatedAt: Timestamp.now(),
                });
                setSelectedChatId(chat.id);
                Swal.close();
            }
           } catch (error) {
            console.log(error);
            Swal.fire({
                title: "Error",
                text: "Failed to create chat",
                icon: "error",
            });
           }
        }
        createNewChat();
    }, [chatUserId, authUser]);

    useEffect(() => {
        const fetchChats = async () => {
            if (!authUser) return;
            const firebaseApp = getFirebaseApp();
            const db = getFirestore(firebaseApp);
            // Subscribe to chats collection
            const filter = query(collection(db, "chats"), where(`members.${authUser.id}`, "!=", null));
            const unsubscribe = onSnapshot(filter, (snapshot) => {
                const chats = snapshot.docs.map((doc) => {
                    return {
                        ...doc.data(),
                        id: doc.id,
                    }
                });
                const sortedChats = chats.sort((a: any, b: any) => b.updatedAt.seconds - a.updatedAt.seconds);
                setChats(sortedChats as UserChat[]);
            });
            return () => unsubscribe();
        }
        fetchChats();
    }, [authUser]);

    const handleSelectChat = (chat: any) => {
        setSelectedChatId(chat.id);
    }

    const handleBack = () => {
        setSelectedChatId("");
    }

    return (
        <>
        <AuthGuard/>
            <div className="chat-container">
                <ChatSidebar chats={chats} authUser={authUser} handleSelectChat={handleSelectChat} selectedChatId={selectedChatId} />
                <ChatWindow selectedChatId={selectedChatId} authUser={authUser} handleBack={handleBack} />
            </div>
        </>
    )
}

function ChatSidebar({chats, authUser, handleSelectChat, selectedChatId}: {chats: UserChat[], authUser: any, handleSelectChat: (chat: UserChat) => void, selectedChatId: string}) {
    const { width } = useWindowSize();
    return (
        <div className={`chat-sidebar ${selectedChatId && width < 768 ? "hidden" : ""}`}>
            <div className="chat-sidebar-header">
                <i className="la la-arrow-left" onClick={() => {
                    window.location.href = "/matches";
                }} style={{cursor: "pointer"}}></i>
                <h3>Chats</h3>
            </div>
            {chats.length > 0 ? (
            <div className="chat-sidebar-body">
                {chats.map((chat, index) => (
                    <ChatSidebarItem key={index} chat={chat} authUser={authUser} handleSelectChat={handleSelectChat} />
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



function ChatSidebarItem({chat, authUser, handleSelectChat}: {chat: UserChat, authUser: any, handleSelectChat: (chat: UserChat) => void}) {
    const [chatUser, setChatUser] = useState<any>(null);

    useEffect(() => {
        const chatUserId = Object.keys(chat.members).find((key: any) => key !== authUser.id);
        if (chatUserId) {
            setChatUser(chat.members[chatUserId]);
        }
    }, [chat, authUser?.id]);

    return (
        <div className="chat-sidebar-item" key={chat.id} onClick={() => handleSelectChat(chat)}>
        <div className="chat-sidebar-item-avatar">
            <img src={chatUser?.profilePicture || null} alt={chatUser?.name || ""} />
        </div>
        <div className="chat-sidebar-item-info">
            <span>{chatUser?.name || ""}</span>
            <span>{chat.messages[chat.messages.length - 1]?.text || ""}</span>
            <span>{chat.messages[chat.messages.length - 1]?.createdAt?.seconds ? new Date(chat.messages[chat.messages.length - 1].createdAt.seconds * 1000).toLocaleString() : ""}</span>
        </div>
    </div>
    )
}

function ChatWindow({selectedChatId, authUser, handleBack}: {selectedChatId: string, authUser: any, handleBack: () => void}) {
    const [chatUser, setChatUser] = useState<any>(null);
    const [selectedChat, setSelectedChat] = useState<any>(null);
    const [message, setMessage] = useState<string>("");
    const {width} = useWindowSize();

    const handleSendMessage = async () => {
        if (!message || message.trim() === "" || !selectedChatId) return;
        console.log("send message", message);

        try {
            const firebaseApp = getFirebaseApp();
            const db = getFirestore(firebaseApp);
            await updateDoc(doc(db, "chats", selectedChatId), {
                messages: arrayUnion({
                    id: guid(),
                    text: message,
                    senderId: authUser.id,
                    createdAt: Timestamp.now(),
                }),
            });
        } catch (error) {
            console.log(error);
        }
        setMessage("");
    }

    useEffect(() => {
        const fetchChat = async () => {
            if (!selectedChatId) return;
            const firebaseApp = getFirebaseApp();
            const db = getFirestore(firebaseApp);
            // Subscribe to chats collection
            const filter = query(collection(db, "chats"), where(documentId(), "==", selectedChatId));
            const unsubscribe = onSnapshot(filter, (snapshot) => {
                if (snapshot.docs.length > 0) {
                    const chat = snapshot.docs[0].data();
                    const chatUserId = Object.keys(chat.members).find((key: any) => key === authUser.id);
                    if (chatUserId) {
                        setChatUser(chat.members[chatUserId]);
                    }
                    setSelectedChat(chat);
                }
            });
            return () => unsubscribe();
        }

        fetchChat();
    }, [selectedChatId, authUser?.id]);

    return (
        <div className="chat-window">
        {selectedChat && (
            <div className="chat-window-container">
            <div className="chat-window-header">
                {/* Img */}
                {width < 768 && <i className="la la-arrow-left" onClick={handleBack} style={{cursor: "pointer"}}></i>}
                <img src={chatUser?.profilePicture} alt={chatUser?.name} />
                <h3 style={{ color: "#fff" }}>{chatUser?.name}</h3>
            </div>
            <div className="chat-window-messages">
                {selectedChat.messages.map((message: any, index: number) => (
                    message.text && (<div className={`chat-window-message ${message.senderId === authUser.id ? "right" : ""}`} key={index}>
                        <div className="chat-window-message-avatar">
                            <img src={selectedChat.members?.[message.senderId]?.profilePicture} alt={selectedChat.members?.[message.senderId]?.name} />
                        </div>
                        <div className="chat-window-message-content">
                            <span>{message.text}</span>
                            <span>{message.createdAt?.seconds ? new Date(message.createdAt.seconds * 1000).toLocaleString() : ""}</span>
                        </div>
                    </div>)
                ))}
            </div>
            <div className="chat-window-input">
                <input id="message-input" type="text" className="form-control" placeholder="Type your message here..." value={message} onChange={(e) => setMessage(e.target.value)} />
                <button className="btn btn-primary" style={{ margin: 0 }} onClick={handleSendMessage}>Send</button>
            </div>
            </div>
        )}
    </div>
    )
}