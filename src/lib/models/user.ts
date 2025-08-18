import { Timestamp, FieldValue, serverTimestamp, DocumentData, FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from "firebase/firestore";

export interface IUser {
    id: string;
    name: string | null;
    aboutMe: string | null;
    gender: string | null;
    showMe: string | null;
    birthdate: Timestamp | null;
    profilePicture: string;
    phoneNumber: string | null;
    location: string | null;
    ageRange: number[] | null;
    createdAt: FieldValue;
    updatedAt: FieldValue;
}

export class User implements IUser {
    id: string;
    name: string | null;
    aboutMe: string | null;
    gender: string | null;
    showMe: string | null;
    birthdate: Timestamp | null;
    profilePicture: string;
    phoneNumber: string | null;
    location: string | null;
    ageRange: number[] | null;
    createdAt: FieldValue;
    updatedAt: FieldValue;

    constructor(data: Omit<IUser, 'createdAt' | 'updatedAt'> & { createdAt?: FieldValue, updatedAt?: FieldValue }) {
        this.id = data.id;
        this.name = data.name;
        this.aboutMe = data.aboutMe;
        this.gender = data.gender;
        this.showMe = data.showMe;
        this.birthdate = data.birthdate;
        this.profilePicture = data.profilePicture || "";
        this.phoneNumber = data.phoneNumber;
        this.location = data.location || null;
        this.ageRange = data.ageRange || null;
        this.createdAt = data.createdAt || serverTimestamp();
        this.updatedAt = data.updatedAt || serverTimestamp();
    }

    toFirestore() {
        return {
            id: this.id,
            name: this.name,
            aboutMe: this.aboutMe,
            gender: this.gender,
            showMe: this.showMe,
            birthdate: this.birthdate,
            profilePicture: this.profilePicture,
            phoneNumber: this.phoneNumber,
            location: this.location,
            ageRange: this.ageRange,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}

export const userConverter: FirestoreDataConverter<User> = {
    toFirestore(user: User): DocumentData {
        return user.toFirestore();
    },
    fromFirestore(
        snapshot: QueryDocumentSnapshot,
        options: SnapshotOptions
    ): User {
        const data = snapshot.data(options)!;
        return new User({
            id: snapshot.id,
            name: data.name,
            aboutMe: data.aboutMe,
            gender: data.gender,
            showMe: data.showMe,
            birthdate: data.birthdate,
            profilePicture: data.profilePicture,
            phoneNumber: data.phoneNumber,
            location: data.location,
            ageRange: data.ageRange,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        });
    },
};
