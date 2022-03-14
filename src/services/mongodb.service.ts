import { connect } from 'mongoose';

export interface IDBConnection {
    connect: () => void;
}

export class MongoDBService implements IDBConnection {
    private _uri: string;

    constructor(uri: string) {
        this._uri = uri;
    }

    connect = async () => {
        await connect(
            this._uri,
            {
                useNewUrlParser: true,
                useUnifiedTopology: true
            }
        );
    };
}
