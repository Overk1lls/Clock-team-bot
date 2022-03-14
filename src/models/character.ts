import { model, Schema } from 'mongoose';
import { ICharacter } from '../interfaces/character';

const character = new Schema<ICharacter>({
    character: { type: String, required: true },
    fraction: { type: String, required: true },
    reputations: [{
        name: { type: String },
        value: { type: String },
        valueMax: { type: String },
        valueName: { type: String },
        tier: { type: Number }
    }]
});

export default model<ICharacter>('character', character);
