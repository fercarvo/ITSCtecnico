//Example of DB.js file

const { Pool } = require('pg')

const users = [
    {user: "jhon", pass: "easypass"},
    {user: "doe", pass: "easypass"},
    {user: "Alice", pass: "wasypass"}
]
var pool = new Pool({
    user: 'pg-foobar-user',
    host: 'passwords.facebook.com',
    database: 'passwords',
    password: '12345',
    port: 5432,
  });

const secret = "iamthesecretofallsecrets"

const sign_alg = 'SHA256'

module.exports = { pool, secret, sign_alg, users }
