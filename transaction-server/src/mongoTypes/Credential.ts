import { ObjectId } from "mongodb";

export interface CredentialMongo {
    _id: ObjectId;
    username: string;
    hash_password: string;
    created: number;
    updated: number;
}