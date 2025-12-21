const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
            const envConfig = fs.readFileSync(envPath, 'utf8');
            envConfig.split('\n').forEach(line => {
                const parts = line.split('=');
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    const value = parts.slice(1).join('=').trim();
                    if (key && value && !key.startsWith('#')) {
                        process.env[key] = value;
                    }
                }
            });
            console.log('.env file loaded');
            console.log('Keys found:', Object.keys(process.env).filter(k => !['Path', 'SystemRoot', 'windir'].includes(k)).join(', ')); // Filter common system envs to reduce noise
        } else {
            console.log('.env file not found');
        }
    } catch (error) {
        console.error('Error loading .env file:', error);
    }
}

loadEnv();

const MONGO_URI = process.env.MONGODB_URL;

if (!MONGO_URI) {
    console.error('MONGO_URI or MONGODB_URI not found in environment variables');
    process.exit(1);
}

// Define User Schema 
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    age: { type: Number, required: true },
    email: { type: String, required: true, unique: true },
    mobile: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    aadharHash: { type: String, required: true, unique: true },
    aadharLast4: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['voter', 'admin'], default: 'voter' },
    isVoted: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    isCandidateApplicant: { type: Boolean, default: false },
    candidateApplicationStatus: { type: String, default: 'none' }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function seedAdmin() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            console.log('⚠️ Admin user already exists:', existingAdmin.email);
            process.exit(0);
        }

        // Admin details
        const adminData = {
            name: 'System Admin',
            age: 30,
            email: 'admin@evoting.com',
            mobile: '9999999999',
            address: 'Admin Headquarters',
            aadharCardNumber: '111122223333', // 12 digits
            password: 'adminpassword123',
            role: 'admin',
            isEmailVerified: true
        };

        // Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminData.password, salt);

        // Hash Aadhar
        const aadharHash = crypto.createHash('sha256').update(adminData.aadharCardNumber).digest('hex');
        const aadharLast4 = adminData.aadharCardNumber.slice(-4);

        // Create Admin User
        const newAdmin = new User({
            name: adminData.name,
            age: adminData.age,
            email: adminData.email,
            mobile: adminData.mobile,
            address: adminData.address,
            aadharHash: aadharHash,
            aadharLast4: aadharLast4,
            password: hashedPassword,
            role: 'admin',
            isEmailVerified: true
        });

        await newAdmin.save();
        console.log('Admin user created successfully!');
        console.log('Email:', adminData.email);
        console.log('Password:', adminData.password);
        console.log('Aadhar:', adminData.aadharCardNumber);

    } catch (error) {
        console.error('Error seeding admin:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

seedAdmin();
