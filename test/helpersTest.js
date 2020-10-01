const { assert } = require('chai');

const { 
  getUserByEmail,
  getUserById,
  getUrlsForUser,
  lookupEmail,
} = require('../helpers.js');

const testUsers = {
  "user1": {
    id: "user1RandomID", 
    email: "user1@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

const testUrls = {
  'shortURL1': { longURL: 'longURL1', userId: 'user1RandomID' },
  'shortURL2': { longURL: 'longURL2', userId: 'user1RandomID' },
  'shortURL3': { longURL: 'longURL3', userId: 'user2RandomID' }
};

describe('getUserByEmail', function() {
  it('should return a user given a valid email', function() {
    const user = getUserByEmail("user1@example.com", testUsers);
    const expected = testUsers['user1'];
    assert.strictEqual(user, expected);
  });

  it('should return undefined given an invalid email', function() {
    const user = getUserByEmail("user3@example.com", testUsers);
    const expected = undefined;
    assert.strictEqual(user, expected);
  });
});

describe('getUserById', function() {
  it('should return a user given a valid id', function() {
    const user = getUserById("user2RandomID", testUsers);
    const expected = testUsers['user2'];
    assert.strictEqual(user, expected);
  });

  it('should return undefined given an invalid Id', function() {
    const user = getUserById("user3RandomID", testUsers);
    const expected = undefined;
    assert.strictEqual(user, expected);
  });
});

describe('getUrlsForUser', function() {
  it('should return a list of urls given a valid id', function() {
    const urls = getUrlsForUser("user2RandomID", testUrls);
    const expected = {
      'shortURL3': { longURL: 'longURL3', userId: 'user2RandomID' }
    };
    assert.deepEqual(urls, expected);
  });

  it('should return an empty object given an invalid Id', function() {
    const urls = getUrlsForUser("user3RandomID", testUrls);
    const expected = {};
    assert.deepEqual(urls, expected);
  });
});

describe('lookupEmail', function() {
  it('should return true if email is in our list', function() {
    const result = lookupEmail("user1@example.com", testUsers);
    const expected = true;
    assert.strictEqual(result, expected);
  });

  it('should return false if email is not in our list', function() {
    const result = lookupEmail("user3@example.com", testUsers);
    const expected = false;
    assert.strictEqual(result, expected);
  });

  it('should return false if no email is provided', function() {
    const result = lookupEmail("", testUsers);
    const expected = false;
    assert.strictEqual(result, expected);
  });
});