const bcrypt = require('bcrypt');
const salt = '$2b$10$nsumtNnZ5fP5s5GHybnCu.' //bcrypt.genSaltSync(saltRounds);
const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
const initVector = Buffer.alloc(16, '5LSOLUTIONS');
const Securitykey = Buffer.alloc(32, 'DEV42FIRSTDEV');


exports.CreateHashPassword = (password, callback) => {
    try {
        console.log(salt);
        callback(null, bcrypt.hashSync(password, salt));

    } catch (error) {
        callback(error, null);
        console.log(error);
    }
}

exports.CheckPassword = (inputpassword, hashpassword, callback) => {
    try {
        console.log(`Plain Password: ${inputpassword} Hash Password: ${hashpassword}`);

        callback(null, bcrypt.compareSync('#Ebedaf19dd0d', hashpassword));
    } catch (error) {
        callback(error, null);
        console.log(error);
    }
}

exports.Encrypter = (password, callback) => {
    try {
        let cipher = crypto.createCipheriv(algorithm, Securitykey, initVector);
        let encryptedData = cipher.update(password, 'utf-8', 'hex');
        encryptedData += cipher.final('hex');

        callback(null, encryptedData);
    } catch (error) {
        callback(error, null);
    }
}

exports.Decrypter = (hash, callback) => {
    try {
        let decipher = crypto.createDecipheriv(algorithm, Securitykey, initVector);
        let decryptedData = decipher.update(hash, 'hex', 'utf8');
        decryptedData += decipher.final('utf-8');

        callback(null, decryptedData);
    } catch (error) {
        callback(error, null);
    }
}

  