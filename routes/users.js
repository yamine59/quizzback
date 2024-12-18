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



/**
 * @swagger
 * /register:
 *    post:
 *      summary: Enregistrer un utilisateur
 *      responses:
 *        201:
 *          description: Utilisateur créé avec succès
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  message:
 *                    type: string
 *                    example: "Utilisateur créé"
 *        500:
 *          description: Erreur serveur
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  error:
 *                    type: string
 *                    example: "Erreur serveur lors de l'insertion de l'utilisateur"
 */
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




/**
 * @swagger
 * /login:
 *   post:  
 *     summary: Connexion utilisateur
 *     description: Authentifie un utilisateur et retourne un token JWT si la connexion réussit.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: "yamine"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Utilisateur connecté avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Utilisateur connecté"
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR..."
 *       401:
 *         description: Échec de l'authentification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Mot de passe incorrect"
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Erreur serveur"
 */
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
                name: user.name,
                firstname: user.firstname

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


/**
 * @swagger
 * /profil:
 *   get:
 *     summary: Récupérer le profil de l'utilisateur
 *     description: Retourne le profil de l'utilisateur authentifié.
 *     security:
 *       - bearerAuth: []   # Indique qu'un token JWT est requis pour l'accès
 *     responses:
 *       200:
 *         description: Profil de l'utilisateur récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "profil de l utilisateur"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 25
 *                     username:
 *                       type: string
 *                       example: "yamine"
 *                     role:
 *                       type: string
 *                       example: "admin"
 *                     name:
 *                       type: string
 *                       example: "Yamine"
 *                     firstname:
 *                       type: string
 *                       example: "Doe"
 *       401:
 *         description: Utilisateur non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Accès refusé. Token manquant ou invalide."
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Erreur serveur"
 */

router.get('/profil', authenticateToken, (req, res) => {
    res.json({ message: "profil de l utilisateur", user: req.user })
   
})










/**
 * @swagger
 * /users:
 *    get:
 *      summary: recuperer les utilisateur
 *      responses:
 *        201:
 *          description: liste des utilisateur
 *          content:
 *            application/json:
 *              schema:
 *                type: array
 *                items:
 *                  type: object
 *                  properties:
 *                      id:
 *                          type: interger
 *                          example: 25
 *                      username:
 *                          type: string
 *                          example: "yaminnee"
 *                      firstname:
 *                          type: string
 *                          example: "yaminnee"
 *                      name:
 *                          type: string
 *                          example: "benkouider"
 *                      role:
 *                          type: string
 *                          example: "admin"      
 *                      created_at:
 *                          type: timestamp
 *                          example: "2024-08-27T12:09:49.000Z"                  
 */
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM users';
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        const filtreuser = results.map(user => ({
            id : user.id,
            username: user.username,
            name: user.name,
            firstname: user.firstname,
            role: user.role,
            created_at: user.created_at
            
        }))
        res.status(200).json(filtreuser);
    });
})



module.exports = router;