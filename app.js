const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

/**
 * set variables to process env
 */

dotenv.config();

const User = require('./models/user');
const Note = require('./models/note');

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(cors());

app.use('/note', async (req, res, next) => {
    const token = req.headers.authorization;
    let isVerify = await verifyToken(token);

    if (isVerify) {
        next();
    } else {
        res.sendStatus(403);
    }
});

app.use('/notes', async (req, res, next) => {
    const token = req.headers.authorization;
    let isVerify = await verifyToken(token);

    if (isVerify) {
        next();
    } else {
        res.sendStatus(403);
    }
});

/**
 * @typedef {mongoose.model} User
 * @property {string} login
 * @property {string} passwordHash
 * @property {string} [_id]
 * 
 * @property {function} verifyPassword
 */

/**
 * @param {string} login - user's login
 * @returns {(Promise<User> | Promise<null>)} Promise object with user's data or null
 */

 async function getUserIfExist(login) {
    /**
     * check user's exist, is login free
     */

    const finded = await User.findOne({login: login});
    return finded;
}

app.get('/', (req, res) => {
  res.send('Hello World!')
});

app.post('/signup', async (req, res) => {
    /**
     * user's login & password pair
     */
    const data = req.body;

    const finded = await getUserIfExist(data.login);

    if (finded) {
        res.send('login already exist');
    } else {

        /**
         * saving new user
         */
        
        const passwordHash = await new User().getPasswordHash(data.password);
        const user = new User({login: data.login, passwordHash: passwordHash});
        user.save();

        res.json(user);
    }
});

app.post('/signin', async (req, res) => {
    const data = req.body;
    const finded = await getUserIfExist(data.login);

    if (!finded) {
        res.sendStatus(404);
    } else {
        const v = await finded.verifyPassword(data.password);

        if (v) {
            const token = finded.makeToken();
            res.json(token);
        } else {
            res.sendStatus(403);
        }
    }

});

app.get('/notes', async (req, res) => {
    const q = req.query;
    let offset = q.offset;
    let limit = q.limit;
    let filter = q.filter;
    let value = q.value;

    let notes = [];

    if (!offset && offset != 0 && !limit && limit != 0 && !filter) {
        notes = await Note.find({});
    } else if (filter && value) {
        const key = filter;
        const obj = {};
        obj[key] = { "$regex": value, "$options": "i" };

        notes = await Note.find(obj);
    } else {
        const len = await Note.count();

        if (!limit) {
           limit = len;   
        }

        if (!offset) {
            offset = 0;
        }

        notes = await Note.find().skip(offset).limit(limit);
    }

    res.json(notes);
});

app.post('/note', async (req, res) => {
    const data = req.body;
    const note = new Note({
        title: data.title, 
        author: data.author, 
        data: data.data,
        date: data.date
    });

    note.save();
    res.json(req.body);
});

/**
 * delete note
 */

app.delete('/note', async (req, res) => {
    const data = req.body;
    const note = await Note.findByIdAndDelete({"_id": data._id});
    res.json(note);
});

app.patch('/note', async (req, res) => {
    const data = req.body;
    const note = await Note.findByIdAndUpdate({"_id": data._id}, data);
    res.json(note);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});

async function verifyToken(token) {
    let isVerify = null;

    try {
        if (token) {
            const tokenPayload = jwt.decode(token);

            if (tokenPayload && tokenPayload.id) {
                const userId = tokenPayload.id;
                const user = await User.findOne({ "_id": userId });
                isVerify = user.verifyToken(token);
            }
        }
    } catch (e) {
        console.log(e);
    }

    return isVerify;
}