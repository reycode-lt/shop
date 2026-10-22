import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

async function connectDB() {
    if (mongoose.connection.readyState >= 1) return;
    await mongoose.connect(MONGODB_URI);
}

// Skema User dengan sistem Role
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    balance: { type: Number, default: 0 }, // Saldo internal user untuk belanja
    role: { type: String, enum: ['user', 'admin'], default: 'user' }, // 👈 Perbedaan Role di sini
    createdAt: { type: Date, default: Date.now }
});

const transactionSchema = new mongoose.Schema({
    trxId: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    type: { type: String, enum: ['TOPUP', 'BUY'], required: true },
    amount: { type: Number, required: true },
    status: { type: String, default: 'SUCCESS' },
    date: { type: String, required: true }
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
export { connectDB };
