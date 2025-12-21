import mongoose, { Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    name: string;
    age: number;
    email: string;
    mobile: string;
    address: string;
    aadharHash: string;
    aadharLast4: string;
    password: string;
    role: 'voter' | 'admin';
    isVoted: boolean;
    isEmailVerified: boolean;
    otp?: string;
    otpExpires?: Date;
    //Candidacyfields
    isCandidateApplicant: boolean;
    candidateApplicationStatus: 'pending' | 'approved' | 'rejected' | 'none';
    candidateParty?: string;
    candidateManifesto?: string;
    candidateAppliedAt?: Date;
    candidateApprovedAt?: Date;

    //Facefields
    faceEmbedding?: number[];
    hasFaceRegistered?: boolean;
    lastFaceVerifiedAt?: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema<IUser>({
    name: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    mobile: {
        type: String,
        required: true,
        unique: true
    },
    address: {
        type: String,
        required: true
    },
    aadharHash: {
        type: String,
        required: true,
        unique: true
    },
    aadharLast4: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['voter', 'admin'],
        default: 'voter'
    },
    isVoted: {
        type: Boolean,
        default: false
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    otp: {
        type: String
    },
    otpExpires: {
        type: Date
    },
    //Candidacyfields
    isCandidateApplicant: {
        type: Boolean,
        default: false
    },
    candidateApplicationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'none'],
        default: 'none'
    },
    candidateParty: {
        type: String
    },
    candidateManifesto: {
        type: String
    },
    candidateAppliedAt: {
        type: Date
    },
    candidateApprovedAt: {
        type: Date
    },

    //Facefields
    faceEmbedding: {
        type: [Number],
        default: []
    },
    hasFaceRegistered: {
        type: Boolean,
        default: false
    },
    lastFaceVerifiedAt: {
        type: Date
    }
});

userSchema.pre('save', async function (next) {
    const user = this as IUser;

    //Hashthepasswordonlyifithasbeenmodified(orisnew)
    if (user.isModified('password')) {
        try {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
        } catch (err) {
            return next(err as Error);
        }
    }

    next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    try {
        //Usebcrypttocomparetheprovidedpasswordwiththehashedpassword
        const isMatch = await bcrypt.compare(candidatePassword, this.password);
        return isMatch;
    } catch (err) {
        throw err;
    }
};

//Forcemodelre-creationindevelopmenttohandleschemachanges
if (process.env.NODE_ENV === 'development' && mongoose.models.User) {
    delete mongoose.models.User;
}

const User: Model<IUser> = mongoose.models?.User || mongoose.model<IUser>('User', userSchema);

export default User;

