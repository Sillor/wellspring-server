


const bcrypt = require("bcrypt")
const saltRounds = 10
const password = "Admin@123"

module.exports = {
  hash: function hash(pass) {
    bcrypt
      .genSalt(saltRounds)
      .then(salt => {
        console.log('Salt: ', salt)
        return bcrypt.hash(pass, salt)
      })
      .then(hash => {
        console.log('Hash: ', hash)
        return hash;
      })
      .finally(() => {
        return 'false';
      })
      .catch(err => { return err.message })
  },

  validateUser: function validateUser(hash) {
    bcrypt
      .compare(password, hash)
      .then(res => {
        console.log(res) // return true
        return true;
      })
      .catch(err => { return err.message })
  }
}