// generates a 6 character alphanumeric string for shortURL and userId
const generateRandomString = () => {
  let str = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++) {
    str += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return str;
};

// returns a user object given an email and the user db
const getUserByEmail = (email, db) => {
  for (const user in db) {
    if (db[user]['email'] === email) return db[user];
  }
};

// returns a user object given an id and the user db
const getUserById = (id, db) => {
  for (const user in db) {
    if (db[user]['id'] === id) return db[user];
  }
};

// returns a url object of all urls belonging to a given user
const getUrlsForUser = (id, db) => {
  const urls = {};
  for (const url in db) {
    if (db[url]['userId'] === id) urls[url] = db[url];
  }
  return urls;
};

module.exports = { 
  generateRandomString,
  getUserByEmail,
  getUserById,
  getUrlsForUser
};