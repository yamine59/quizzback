const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const mysql = require('mysql2');
require('dotenv').config();


const jwt = require('jsonwebtoken')

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    token: process.env.TOKEN_SECRET

})




router.post('/register', async (req, res) => {
    const { username, password, name, firstname } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = 'INSERT INTO users (username, password, name ,firstname) VALUE (?,?,?,?)';
    db.query(sql, [username, hashedPassword, name, firstname], (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.status(201).send({ message: 'Utilisateur créé' });
    })
})

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const sql = 'SELECT * FROM users WHERE username = ?';

    db.query(sql, [username, password], async (err, results) => {
        const user = results[0];
        if (results.length === 0 || !(await bcrypt.compare(password, user.password))) {

            return res.status(500).send({ message: 'erreur' });

        }


        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                role: user.role,
            },
            process.env.TOKEN_SECRET,  // Utilisez la variable d'environnement
            { expiresIn: '1h' }
        );
        res.status(200).json({

            message: 'Utilisateur connecté', token: token
        });

    })
   
})


function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, '123456789', (err, user) => {

        if (err) return res.sendStatus(403);

        req.user = user

        next()
    })
}

router.get('/profile', authenticateToken, (req, res) => {
    res.json({ message: "profil de l utilisateur", user: req.user })
   
})




router.get('/', (req, res) => {
    const sql = 'SELECT * FROM users';
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.status(200).json(results);
    });
})



module.exports = router;