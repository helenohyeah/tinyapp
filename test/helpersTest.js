const { assert } = require('chai');

const { getUserByEmail } = require('../helpers.js');

const testUsers = {
  "user1RandomID": {
    id: "user1RandomID", 
    email: "user1@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user given a valid email', function() {
    const user = getUserByEmail("user1@example.com", testUsers);
    const expected = testUsers['user1RandomID'];
    assert.strictEqual(user, expected);
  });

  it('should return undefined given an invalid email', function() {
    const user = getUserByEmail("user3@example.com", testUsers);
    const expected = undefined;
    assert.strictEqual(user, expected);
  });
});