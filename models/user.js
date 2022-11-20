const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

if (!process.env.LINK) {
    console.log('user');
    dotenv.config();
}

const link = process.env.LINK;
const conn = mongoose.createConnection(link);

const Schema = mongoose.Schema;
const user = new Schema({
    login: String,
    passwordHash: String,
});

/**
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>} Promise with password's validation status: is password right
 */

user.methods.verifyPassword = async function(password) {
    const result = await bcrypt.compare(password, this.passwordHash);
    return result;
};

/**
 * @param {string} password 
 * @returns {Promise<string>} Promise with hash
 */

user.methods.getPasswordHash = async function(password, saltRounds = 10) {
    const hash = await bcrypt.hash(password, saltRounds);
    return hash;
};

/**
 * 
 * @param {User} user 
 * @returns {string} jwt
 */

user.methods.makeToken = function() {
    const token = jwt.sign({id: this._id}, this.passwordHash, {
        algorithm: 'HS256'
    });

    return token;
}

user.methods.verifyToken = function(token) {
    const result = jwt.verify(token, this.passwordHash);
    return result;
}

const User = conn.model('users', user);
module.exports = User;