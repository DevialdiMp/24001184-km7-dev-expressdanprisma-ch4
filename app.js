const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

app.use(express.json());


//MENAMBAHKAN USER DAN PROFILNYA KARENA RELASI (create)
app.post('/api/v1/users', async (req, res) => {
    let { name, email, bio } = req.body;
    try {
        let user = await prisma.user.create({
            data: {
                name,
                email,
                profile: {
                    create: {
                        bio,
                    },
                },
            },
        });
        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ error: 'Terjadi kesalahan saat menambahkan User' });
    }
});


//MENAMPILKAN DATA USER (read)
app.get('/api/v1/users', async (req, res) => {
    try {
        let users = await prisma.user.findMany({
            include: { profile: true },
        });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ Pesan: 'Terjadi kesalahan' });
    }
});


//MENAMPILKAN USER SESUAI DENGAN ID NYA (read)
app.get('/api/v1/users/:userId', async (req, res) => {
    let { userId } = req.params;
    try {
        const user = await prisma.user.findUnique({
            where: { id: Number(userId) },
            include: { profile: true },
        });
        if (!user) {
            return res.status(404).json({ Pesan: 'Pengguna tidak ditemukan!' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ Pesan: 'Silahkan periksa id pengguna dengan benar' });
    }
});


//UPDATE USERS DAN PROFILNYA KARENA RELASI BERDASARKAN ID (update)
app.put('/api/v1/users/:userId', async (req, res) => {
    let { userId } = req.params;
    let { name, email, bio } = req.body;

    try {
        let user = await prisma.user.update({
            where: { id: Number(userId) },
            data: {
                name,
                email,
                profile: {
                    update: {
                        bio,
                    },
                },
            },
            include: { profile: true },
        });

        res.status(200).json({ Pesan: 'User dan profil berhasil diupdate', user });
    } catch (error) {
        res.status(500).json({ Kesalahan: 'Gagal mengupdate User dan profil', details: error.message });
    }
});


//UNTUK DELETE USERS DAN PROFILNYA KARENA RELASI BERDASARKAN ID (delete)
app.delete('/api/v1/users/:userId', async (req, res) => {
    let { userId } = req.params;

    try {

        //profil harus dihapus dulu baru dilanjutkan menghapus user karena terdapat relasi diantara kedua table tersebut.
        await prisma.profile.delete({
            where: { userId: Number(userId) }
        });

        let user = await prisma.user.delete({
            where: { id: Number(userId) },
        });

        res.status(200).json({ Pesan: 'User dan profil berhasil dihapus', user });
    } catch (error) {
        res.status(500).json({ Pesan: 'Gagal menghapus User dan profil', details: error.message });
    }
});


//MENAMBAHKAN DATA AKUN (create)
app.post('/api/v1/accounts', async (req, res) => {
    let { userId, accountNumber, balance } = req.body;
    console.log(req.body);
    try {
        let account = await prisma.bankAccount.create({
            data: {
                accountNumber,
                balance,
                user: {
                    connect: { id: Number(userId) },
                },
            },
        });
        console.log(account);
        res.status(201).json(account);
    } catch (error) {
        console.error(error);
        res.status(500).json({ Pesan: 'Terjadi kesalahan saat membuat akun' });
    }
});


//MENAMPILKAN DAFTAR AKUN (read)
app.get('/api/v1/accounts', async (req, res) => {
    try {
        let accounts = await prisma.bankAccount.findMany();
        res.status(200).json(accounts);
    } catch (error) {
        res.status(500).json({ Pesan: 'Terjadi kesalahan pada data akun' });
    }
});


//MENAMPILKAN DETAIL AKUN BERDASARKAN ID (read)
app.get('/api/v1/accounts/:id', async (req, res) => {
    let { id } = req.params;

    try {
        // Temukan akun berdasarkan ID
        let account = await prisma.bankAccount.findUnique({
            where: { id: Number(id) },
            include: {
                user: true,
                sentTransactions: true,
                receivedTransactions: true,
            },
        });

        if (!account) {
            return res.status(404).json({ Pesan: 'Akun tidak ditemukan' });
        }

        res.status(200).json(account);
    } catch (error) {
        console.error(error);
        res.status(500).json({ Pesan: 'Terjadi kesalahan' });
    }
});


// UPDATE AKUN BERDASARKAN ID (update)
app.put('/api/v1/accounts/:id', async (req, res) => {
    let { accountNumber, balance, userId } = req.body;
    let { id } = req.params;

    try {
        const accountExists = await prisma.bankAccount.findUnique({
            where: { id: Number(id) },
        });

        if (!accountExists) {
            return res.status(404).json({ Pesan: 'Akun tidak ditemukan' });
        }

        const userExists = await prisma.user.findUnique({
            where: { id: Number(userId) },
        });

        if (!userExists) {
            return res.status(404).json({ Pesan: 'User tidak ditemukan' });
        }
        let account = await prisma.bankAccount.update({
            where: { id: Number(id) },
            data: {
                accountNumber,
                balance,
                user: {
                    connect: { id: Number(userId) },
                },
            },
        });

        res.status(200).json(account);
    } catch (error) {
        console.error(error);
        res.status(500).json({ Kesalahan: 'Gagal mengupdate akun', details: error.message });
    }
});


// HAPUS AKUN BESERTA TRANSAKSINYA KARENA RELASI (delete)
app.delete('/api/v1/accounts/:id', async (req, res) => {
    let { id } = req.params;

    try {
        let account = await prisma.bankAccount.findUnique({
            where: { id: Number(id) },
            include: {
                sentTransactions: true,  // Menyertakan transaksi yang dikirim
                receivedTransactions: true,  // Menyertakan transaksi yang diterima
            },
        });

        if (!account) {
            return res.status(404).json({ Pesan: 'Akun tidak ditemukan' });
        }

        // Hapus transaksi yang dikirim
        await prisma.transactions.deleteMany({
            where: {
                senderId: Number(id),
            },
        });

        // Hapus transaksi yang diterima
        await prisma.transactions.deleteMany({
            where: {
                receiverId: Number(id),
            },
        });

        // Hapus akun permanent boss
        await prisma.bankAccount.delete({
            where: { id: Number(id) },
        });

        res.status(200).json({ Pesan: 'Akun berhasil dihapus' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ Kesalahan: 'Gagal menghapus akun', details: error.message });
    }
});


//MENGIRIMKAN UANG DARI AKUN A KE AKUN B (create)
app.post('/api/v1/transactions', async (req, res) => {
    let { senderId, receiverId, amount } = req.body;

    try {
        //MENCARI AKUN BERDASARKAN userId
        let senderAccount = await prisma.bankAccount.findFirst({
            where: {
                userId: Number(senderId),
            },
        });

        let receiverAccount = await prisma.bankAccount.findFirst({
            where: {
                userId: Number(receiverId),
            },
        });

        //VALIDASI AKUN
        if (!senderAccount || !receiverAccount) {
            return res.status(404).json({ Pesan: 'Terjadi kesalahan pengirim atau penerima tidak ditemukan' });
        }

        //VALIDASI SALDO
        if (amount > senderAccount.balance) {
            return res.status(400).json({ Pesan: 'Saldo anda tidak mencukupi' });
        }

        let transaction = await prisma.transactions.create({
            data: {
                amount,
                sender: {
                    connect: { id: senderAccount.id },
                },
                receiver: {
                    connect: { id: receiverAccount.id },
                },
            },
        });

        //UPDATE SALDO OTOMATIS PADA AKUN PENGIRIM DAN PENERIMA
        await prisma.bankAccount.update({
            where: { id: senderAccount.id },
            data: { balance: senderAccount.balance - amount },
        });

        await prisma.bankAccount.update({
            where: { id: receiverAccount.id },
            data: { balance: receiverAccount.balance + amount },
        });

        res.status(201).json(transaction);
    } catch (error) {
        console.error(error);
        res.status(500).json({ Pesan: 'Terjadi kesalahan dalam melakukan transaksi' });
    }
});


//MENAMPILKAN DATA TRAKSAKSI (read)
app.get('/api/v1/transactions', async (req, res) => {
    try {
        let transactions = await prisma.transactions.findMany({
            include: { sender: true, receiver: true },
        });
        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({ Pesan: 'Terjadi kesalahaan saat transaksi' });
    }
});


//MENAMPILKAN DETAIL TRAKSAKSI BERDASARKAN ID (read)
app.get('/api/v1/transactions/:transactionId', async (req, res) => {
    let { transactionId } = req.params;

    try {

        let transaction = await prisma.transactions.findUnique({
            where: { id: Number(transactionId) },
            include: {
                sender: {
                    select: {
                        id: true,
                        accountNumber: true,
                        user: { select: { name: true } } // Mengambil nama dari pemilik akun pengirim
                    }
                },
                receiver: {
                    select: {
                        id: true,
                        accountNumber: true,
                        user: { select: { name: true } } // Mengambil nama dri pemilik akun penerima
                    }
                },
            },
        });

        if (!transaction) {
            return res.status(404).json({ Pesan: 'Transaksi tidak ditemukan' });
        }

        let response = {
            id: transaction.id,
            amount: transaction.amount,
            createdAt: transaction.createdAt,
            sender: {
                id: transaction.sender.id,
                accountNumber: transaction.sender.accountNumber,
                name: transaction.sender.user.name, // INI NI NAMA PENGIRIMNYA
            },
            receiver: {
                id: transaction.receiver.id,
                accountNumber: transaction.receiver.accountNumber,
                name: transaction.receiver.user.name, // YANG INI NAMA PENERIMA
            },
        };

        res.status(200).json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ Pesan: 'Terjadi kesalahan pada detail transaksi' });
    }
});


// Hapus transaksi berdasarkan ID
app.delete('/api/v1/transactions/:transactionId', async (req, res) => {
    const { transactionId } = req.params;

    try {
        // Cek apakah transaksi dengan ID tersebut ada
        const transaction = await prisma.transactions.findUnique({
            where: { id: Number(transactionId) },
        });

        if (!transaction) {
            return res.status(404).json({ Pesan: 'Transaksi tidak ditemukan' });
        }

        // Hapus transaksi
        await prisma.transactions.delete({
            where: { id: Number(transactionId) },
        });

        res.status(200).json({ Pesan: 'Transaksi berhasil dihapus' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Gagal menghapus transaksi', details: error.message });
    }
});


app.listen(3000, () => {
    console.log('Hallo Devialdi Maisa Putra!');
    console.log('Server berjalan di http://localhost:3000');
});
