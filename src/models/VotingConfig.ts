import mongoose, { Document, Model } from 'mongoose';

export interface IVotingConfig extends Document {
    startTime: Date;
    endTime: Date;
    isVotingEnabled: boolean;
    isResultDeclared: boolean;
}

const votingConfigSchema = new mongoose.Schema<IVotingConfig>({
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    isVotingEnabled: {
        type: Boolean,
        default: false
    },
    isResultDeclared: {
        type: Boolean,
        default: false
    }
});

//Ensureonlyoneconfigexists(singletonpatternvialogic,butmodelisstandard)
const VotingConfig: Model<IVotingConfig> = mongoose.models?.VotingConfig || mongoose.model<IVotingConfig>('VotingConfig', votingConfigSchema);

export default VotingConfig;

