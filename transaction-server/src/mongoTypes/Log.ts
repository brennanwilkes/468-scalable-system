import { ObjectId } from "mongodb";

export interface LogMongo {
    _id: ObjectId;
    log_id: string;
    command: string;
    status: string;
    description: string;
    timestamp: number;
}