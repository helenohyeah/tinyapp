// Packages
const express = require("express");
const bodyParser = require("body-parser");
// const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

// Server set-up
const app = express();
const PORT = 8080; // default port 8080
app.set("view engine", "ejs");

// Middleware
app.use(bodyParser.urlencoded({extended: true}));
// app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

// hardcoded url data
const urlDatabase = {
  'b2xVn2': { longURL: 'http://www.lighthouselabs.ca', userId: '42hb2E' },
  '9sm5xK': { longURL: 'http://www.google.com', userId: '42hb2E' },
  '43hb2E': { longURL: 'http://www.spotify.com', userId: '9sDexK' }
};

// hardcoded user data
const users = {
  "1": {
    id: "42hb2E",
    email: "helen@gmail.com",
    password: "zzzz"
  },
  "2": {
    id: "9sDexK",
    email: "melon@gmail.com",
    password: "aaaa"
  }
};

// generates a 6 character alphanumeric string for shortURL
const generateRandomString = () => {
  let str = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++) {
    str += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return str;
};

const getNextNum = (num) => {
  num++;
  return num;
};

const getUserObjById = (userId) => {
  for (const user in users) {
    if (users[user]['id'] === userId) return users[user];
  }
};

const lookupEmail = (email) => {
  for (const user in users) {
    if (users[user]['email'] === email) return true;
  }
  return false;
};

const getHashedPasswordByEmail = (email) => {
  for (const user in users) {
    if (users[user]['email'] === email) return users[user]['password'];
  }
};

const getUrlsForUser = (id) => {
  const urls = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url]['userId'] === id) urls[url] = urlDatabase[url];
  }
  return urls;
};

const getUserIdByShortURL = (shortURL) => {
  for (const url in urlDatabase) {
    if (url === shortURL) return urlDatabase[url]['userId'];
  }
};

const getUserIdByEmail = (email) => {
  for (const user in users) {
    if (users[user]['email'] === email) return users[user]['id'];
  }
};

app.get("/", (req, res) => {
  const userId = req.session['user_id'];
  if (userId === undefined) {
    res.status(401).redirect('/login');
  } else {
    res.redirect('/urls');
  }
});

// browse urls that the user created only if user is logged in
app.get("/urls", (req, res) => {
  const userId = req.session['user_id'];
  const user = getUserObjById(userId);
  const urls = getUrlsForUser(userId);
  const templateVars = {
    urls,
    user,
  };
  (user === undefined) ? templateVars['loggedIn'] = false : templateVars['loggedIn'] = true;
  res.render('urls_index', templateVars);
});

// browse create a new url page only if user is logged in
app.get('/urls/new', (req, res) => {
  const userId = req.session['user_id'];
  const user = getUserObjById(userId);
  const templateVars = {
    user
  };
  if (user === undefined) {
    res.redirect('/login');
    return;
  }
  res.render('urls_new', templateVars);
});

// browse individual short url page and allow user to edit only if user is logged in
app.get('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  if (!Object.keys(urlDatabase).includes(shortURL)) {
    res.redirect('/*');
    return;
  }
  const longURL = urlDatabase[shortURL]['longURL'];
  const userId = req.session['user_id'];
  const user = getUserObjById(userId);
  const templateVars = {
    shortURL,
    longURL,
    user
  };
  if (user === undefined) {
    templateVars['loggedIn'] = false;
  } else if (urlDatabase[shortURL]['userId'] !== userId) {
    templateVars['loggedIn'] = false;
  } else {
    templateVars['loggedIn'] = true;
  }
  res.render('urls_show', templateVars);
});

// redirector that sends user to a longURL given a shortURL
app.get('/u/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL]['longURL'];
  res.redirect(longURL || '/*');
});

// render register page
app.get('/register', (req, res) => {
  const userId = req.session['user_id'];
  const user = getUserObjById(userId);
  const templateVars = {
    user
  };
  res.render('register', templateVars);
});

// render login page
app.get('/login', (req, res) => {
  const userId = req.session['user_id'];
  const user = getUserObjById(userId);
  const templateVars = {
    user
  };
  res.render('login', templateVars);
});

// catch all
app.get('*', (req, res) => {
  res.status(404).send('404 Not Found :(');
});

// login using email and password and sets a cookie
app.post('/login', (req, res) => {
  const email = req.body['email'];
  const password = req.body['password'];
  const hashedPassword = getHashedPasswordByEmail(email);
  
  // invalid email
  if (!lookupEmail(email)) {
    res.status(403).send('Oh no, email not found.');
    return;
  // invalid password
  } else if (!bcrypt.compareSync(password, hashedPassword)) {
    res.status(403).send('Oh no, password doesn\'t match our records.');
    return;
  } else {
    const id = getUserIdByEmail(email);
    req.session['user_id'] = id;
    res.redirect('/urls');
  }
});

// logout and clear cookies
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('urls');
});

// register with email and password
app.post('/register', (req, res) => {
  const num = getNextNum(Math.max(...Object.keys(users)));
  const id = generateRandomString();
  const email = req.body['email'];

  // securing password
  const password = req.body['password'];
  const hashedPassword = bcrypt.hashSync(password, 10);

  // empty email or password
  if (email === '' || password === '') {
    res.status(400).send('Oh no, empty email and/or password.');
    return;
  // email already exists
  } else if (lookupEmail(email)) {
    res.status(400).send('Oops, that email already exists.');
    return;
  }
  users[num] = {
    id,
    email,
    password: hashedPassword
  };
  console.log(id);
  req.session['user_id'] = id;
  res.redirect('/urls');
});

// creates a new shortURL given a longURL
app.post('/urls', (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body['longURL'];
  const userId = req.session['user_id'];
  urlDatabase[shortURL] = {
    longURL,
    userId
  };
  res.redirect(`/urls/${shortURL}`);
});

// deletes a shortURL given the shortURL to delete then redirects to home
app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  const userId = getUserIdByShortURL(shortURL);
  // logged in
  if (userId === req.session['user_id']) {
    const shortURL = req.params.shortURL;
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  } else {
    res.status(401).send('Sorry, you must be logged in to delete this URL.');
  }
});

// updates the longURL of a given shortURL
app.post('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const userId = getUserIdByShortURL(shortURL);
  // logged in
  if (userId === req.session['user_id']) {
    const longURL = req.body['id'];
    urlDatabase[shortURL]['longURL'] = longURL;
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.status(401).send('Sorry, you must be logged in to edit this URL.');
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});