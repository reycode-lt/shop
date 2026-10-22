import { connectDB, User } from '../lib/models.js';
import axios from 'axios';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-User-Id');

    if (req.method === 'OPTIONS') return res.status(200).end();

    await connectDB();
    const { action } = req.query;
    const body = req.body || {};

    try {
        // 1. REGISTER USER BARU (Default role: 'user')
        if (req.method === 'POST' && action === 'register') {
            const { name, email, password } = body;
            if (!name || !email || !password) {
                return res.status(400).json({ status: false, message: "Semua kolom wajib diisi!" });
            }

            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ status: false, message: "Email sudah terdaftar." });
            }

            const newUser = await User.create({
                name,
                email,
                password,
                balance: 0,
                role: 'user' // Otomatis jadi pembeli biasa
            });

            return res.status(200).json({
                status: true,
                message: "Registrasi berhasil!",
                user: { id: newUser._id, name: newUser.name, role: newUser.role }
            });
        }

        // 2. LOGIN (Mengembalikan role user agar frontend tahu harus diarahkan kemana)
        if (req.method === 'POST' && action === 'login') {
            const { email, password } = body;
            const user = await User.findOne({ email, password });

            if (!user) {
                return res.status(401).json({ status: false, message: "Email atau password salah!" });
            }

            return res.status(200).json({
                status: true,
                message: "Login berhasil!",
                user: { 
                    id: user._id, 
                    name: user.name, 
                    email: user.email, 
                    balance: user.balance, 
                    role: user.role // 👈 Frontend bisa cek: if(role === 'admin') masuk dashboard admin
                }
            });
        }

        // 3. ENDPOINT KHUSUS ADMIN: CEK SALDO MELDA PAY
        if (req.method === 'GET' && action === 'admin-meldapay-balance') {
            const requesterId = req.headers['x-user-id']; // ID user yang sedang login

            // Verifikasi ke database apakah user ini benar-benar ADMIN
            const adminCheck = await User.findById(requesterId);
            if (!adminCheck || adminCheck.role !== 'admin') {
                return res.status(403).json({ 
                    status: false, 
                    message: "Akses ditolak! Anda bukan Admin." // 🛡️ Mencegah pembobolan oleh user biasa
                });
            }

            const apiKey = process.env.MELDAPAY_API_KEY; // Disimpan aman di environment Vercel
            const meldaRes = await axios.get(`https://meldapay.com/api/balance?apikey=${apiKey}`);

            return res.status(200).json({
                status: true,
                description: "Saldo MeldaPay khusus Admin",
                meldaData: meldaRes.data
            });
        }

        return res.status(404).json({ status: false, message: "Endpoint tidak ditemukan." });

    } catch (err) {
        return res.status(500).json({ status: false, message: err.message });
    }
}
