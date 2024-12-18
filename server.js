require ('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const swaggerJsDoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')
const cors = require('cors');
const app = express();

app.use(cors());

app.use(bodyParser.json())

const swaggerOptions = {
    swaggerDefinition: {
        openapi:'3.0.0',
        info: {
            title:'api quizz',
            version: '0.0.1',
            description: 'je suis une super api',
            contact: {
                name:'Yamine'
            },
            servers: [{url:'http://localhost:3100'}]
        }
    },
    apis:['./routes/*.js']
}

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-doc', swaggerUi.serve, swaggerUi.setup(swaggerDocs))

//connexion base de donnée
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database : process.env.DB_NAME,
    

})

db.connect((err) => {
    if (err){
        console.log('ERREUR !!!');
    }
    else{
        console.log('bravo !!');
    }

})

const userRoutes= require('./routes/users.js');
app.use('/api/users' , userRoutes);

const quizzRoutes= require('./routes/quizz.js');
app.use('/api/quizz' , quizzRoutes);


const port = process.env.PORT ||  3200;
app.listen(port, () =>{
    console.log('SERVER  DEMMARE')
})