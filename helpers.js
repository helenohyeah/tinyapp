const getUserByEmail = (email, db) => {
  for (const user in db) {
    if (db[user]['email'] === email) return db[user];
  }
};

module.exports = { getUserByEmail };