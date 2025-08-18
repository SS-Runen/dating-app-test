import {
    FieldValue,
    serverTimestamp,
    DocumentData,
    FirestoreDataConverter,
    QueryDocumentSnapshot,
    SnapshotOptions,
} from "firebase/firestore";

// --- Chat Model ---

export interface IChatMember {
    name: string;
    profilePicture: string;
}

export interface IChat {
    id: string;
    updatedAt: FieldValue;
    memberIds: string[];
    members: { [userId: string]: IChatMember };
    lastMessage: IMessage | null;
}

export class Chat implements IChat {
    id: string;
    updatedAt: FieldValue;
    memberIds: string[];
    members: { [userId: string]: IChatMember };
    lastMessage: IMessage | null;

    constructor(data: Omit<IChat, 'updatedAt'> & { updatedAt?: FieldValue }) {
        this.id = data.id;
        this.updatedAt = data.updatedAt || serverTimestamp();
        this.memberIds = data.memberIds;
        this.members = data.members;
        this.lastMessage = data.lastMessage || null;
    }

    toFirestore(): DocumentData {
        return {
            id: this.id,
            updatedAt: this.updatedAt,
            memberIds: this.memberIds,
            members: this.members,
            lastMessage: this.lastMessage,
        };
    }
}

export const chatConverter: FirestoreDataConverter<Chat> = {
    toFirestore(chat: Chat): DocumentData {
        return chat.toFirestore();
    },
    fromFirestore(
        snapshot: QueryDocumentSnapshot,
        options: SnapshotOptions
    ): Chat {
        const data = snapshot.data(options)!;
        return new Chat({
            id: snapshot.id,
            updatedAt: data.updatedAt,
            memberIds: data.memberIds,
            members: data.members,
            lastMessage: data.lastMessage,
        });
    },
};

// --- Message Model ---

export interface IMessage {
    id: string;
    createdAt: FieldValue;
    senderId: string;
    text: string;
}

export class Message implements IMessage {
    id: string;
    createdAt: FieldValue;
    senderId: string;
    text: string;

    constructor(data: Omit<IMessage, 'createdAt'> & { createdAt?: FieldValue }) {
        this.id = data.id;
        this.createdAt = data.createdAt || serverTimestamp();
        this.senderId = data.senderId;
        this.text = data.text;
    }

    toFirestore(): DocumentData {
        return {
            createdAt: this.createdAt,
            senderId: this.senderId,
            text: this.text,
        };
    }
}

export const messageConverter: FirestoreDataConverter<Message> = {
    toFirestore(message: Message): DocumentData {
        return message.toFirestore();
    },
    fromFirestore(
        snapshot: QueryDocumentSnapshot,
        options: SnapshotOptions
    ): Message {
        const data = snapshot.data(options)!;
        return new Message({
            id: snapshot.id,
            createdAt: data.createdAt,
            senderId: data.senderId,
            text: data.text,
        });
    },
};
