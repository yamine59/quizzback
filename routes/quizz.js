const express = require('express');
const router = express.Router();

const mysql = require('mysql2');
require('dotenv').config();


const jwt = require('jsonwebtoken')

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,


})

router.post('/createquizz', async (req, res) => {
    const { name_quizz, questions } = req.body;
    const quizSql = 'INSERT INTO quizz (name_quizz) VALUE (?)';
    db.query(quizSql, [name_quizz], (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        const idQuiz = results.insertId;
        // res.status(201).send({ quizid: results.insertId });
        const questionSql = 'INSERT INTO questions (id_quizz, question_text,reponse,reponse_true) VALUE ?';
        //envoi les question avec l'id
        const questionData = questions.map(q => [
            idQuiz,
            q.question_text,
            JSON.stringify(q.reponse),
            q.reponse_true,
        ])

        db.query(questionSql, [questionData], (err) => {
            if (err) {
                return res.status(500).send(err);
            }
            res.status(201).send({ message: 'question créé' });
        })
    })
})



router.put('/updatequizz/:id_quizz', (req, res) => {
    const { id_quizz } = req.params
    const { name_quizz, questions } = req.body;

    const quizSql = 'UPDATE quizz SET name_quizz = ? WHERE id_quizz = ?';
    db.query(quizSql, [name_quizz, id_quizz], (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }


        const deleteSql = 'DELETE FROM questions WHERE id_quizz = ?';
        db.query(deleteSql, [id_quizz], (err, results) => {
            if (err) {
                return res.status(500).send(err);
            }
            const questionSql = 'INSERT INTO questions (id_quizz, question_text,reponse,reponse_true) VALUE ?';
            //envoi les question avec l'id
            const questionData = questions.map(q => [
                id_quizz,
                q.question_text,
                JSON.stringify(q.reponse),
                q.reponse_true,
            ])

            db.query(questionSql, [questionData], (err) => {
                if (err) {
                    return res.status(500).send(err);
                }
                res.status(201).send({ message: 'quizz a jour' });
            })
        })



    })

})

router.get('/updatequizz/:id_quiz', async (req, res) => {
    const { id_quiz } = req.params;

    try {
        const sqlQuiz = 'SELECT * FROM quizz WHERE id_quizz = ?';
        const [quizResults] = await db.promise().query(sqlQuiz, [id_quiz]);

        if (quizResults.length === 0) {
            return res.status(404).json({ message: 'Quiz non trouvé' });
        }

        const quiz = quizResults[0];

        const sqlQuestions = 'SELECT * FROM questions WHERE id_quizz = ?';
        const [questionResults] = await db.promise().query(sqlQuestions, [id_quiz]);

        quiz.questions = questionResults.map(q => ({
            question_text: q.question_text,
            reponse: JSON.parse(q.reponse),
            reponse_true: q.reponse_true
        }));


        const quizzToken = jwt.sign({ quiz }, process.env.TOKEN_SECRET, { expiresIn: '1h' });

        res.status(200).json({ quiz: quizzToken });

    } catch (err) {
        console.error('Erreur serveur:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});


router.put('/isactive', (req, res) => {

    const { isactive, id_quizz } = req.body;

    const quizSql = 'UPDATE quizz SET isactive = ? WHERE id_quizz = ?';
    db.query(quizSql, [isactive, id_quizz], (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.status(200).send({ message: 'flag changer' });
    })


})

router.get('/isactive', (req, res) => {

    const quizSql = 'SELECT * FROM quizz WHERE isactive = 1  ORDER BY id_quizz DESC';
    db.query(quizSql, (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.status(200).send({ message: results });
    })

})



router.delete('/delete/:id', (req, res) => {
    const quizid = req.params.id;
    const sql = 'DELETE FROM quizz WHERE id_quizz = ?';

    db.query(sql, [quizid], (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        if (results.affectedRows === 0) {
            return res.status(404).send('non trouvé');
        }
        res.status(200).send('bravo');
    });
});


router.get('/listquizz', async (req, res) => {


    const sql = 'SELECT * FROM quizz  ORDER BY id_quizz DESC';
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.status(201).send({ quizz: results });


    })
})



router.get('/:id', async (req, res) => {

    const quizid = req.params.id;
    const sql = 'SELECT * FROM quizz where id_quizz = ?';
    db.query(sql, [quizid], (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.status(201).send({ message: results });


    })
})




module.exports = router;

