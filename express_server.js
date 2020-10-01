// Packages
const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

// Helpers
const {
  getUserByEmail,
  generateRandomString,
  getUserById,
  getUrlsForUser
} = require('./helpers');

// Server set-up
const app = express();
const PORT = 8080; // default port 8080
app.set("view engine", "ejs");

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['averylongsecretkey', 'anotherverylongsecretkey']
}));

// hardcoded url data
const urlDatabase = {
  'b2xVn2': { longURL: 'http://www.lighthouselabs.ca', userId: '42hb2E' },
  '9sm5xK': { longURL: 'http://www.google.com', userId: '42hb2E' },
  '43hb2E': { longURL: 'http://www.spotify.com', userId: '9sDexK' }
};

// hardcoded user data
const userDatabase = {
  '1': {
    id: '42hb2E',
    email: 'helen@gmail.com',
    password: bcrypt.hashSync('hhhh', 5)
  },
  '2': {
    id: '9sDexK',
    email: 'melon@gmail.com',
    password: bcrypt.hashSync('mmmm', 5)
  }
};

const getNextNum = (num) => {
  num++;
  return num;
};

const lookupEmail = (email) => {
  for (const user in userDatabase) {
    if (userDatabase[user]['email'] === email) return true;
  }
  return false;
};

const getUserIdByShortURL = (shortURL) => {
  for (const url in urlDatabase) {
    if (url === shortURL) return urlDatabase[url]['userId'];
  }
};

// root path redirector
app.get("/", (req, res) => {
  const userId = req.session['user_id'];
  // user is not logged in
  if (!userId) {
    res.status(401).redirect('/login');
  // user is logged in
  } else {
    res.redirect('/urls');
  }
});

// browse urls that the user created
// ejs handles not logged in state
app.get("/urls", (req, res) => {
  const userId = req.session['user_id'];
  const user = getUserById(userId, userDatabase);
  const urls = getUrlsForUser(userId, urlDatabase);
  const templateVars = {
    urls,
    user
  };
  res.render('urls_index', templateVars);
});

// browse create a new url page
app.get('/urls/new', (req, res) => {
  const userId = req.session['user_id'];
  const user = getUserById(userId, userDatabase);
  const templateVars = {
    user
  };
  // user is not logged in
  if (!user) {
    res.redirect('/login');
  // user is logged in
  } else {
    res.render('urls_new', templateVars);
  }
});

// browse specific short url page
app.get('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  // valid short url
  if (shortURL in urlDatabase) {
    const longURL = urlDatabase[shortURL]['longURL'];
    const userId = req.session['user_id'];
    const user = getUserById(userId, userDatabase);
    const templateVars = {
      shortURL,
      longURL,
      user,
      access: false
    };
    // check if user has access to short url
    if (urlDatabase[shortURL]['userId'] === userId) {
      templateVars['access'] = true;
    }
    res.render('urls_show', templateVars);
  // invalid short url
  } else {
    res.status(404).send(`TinyURL ${shortURL} doesn't exist :(`);
  }
});

// redirects to long url given a short url
app.get('/u/:shortURL', (req, res) => {
  const { shortURL } = req.params;
  const { longURL } = urlDatabase[shortURL];
  // valid short url
  if (shortURL) {
    res.redirect(longURL);
  // invalid short url
  } else {
    res.status(404).send(`TinyURL '${shortURL}' doesn't exist :(`)
  }
});

// render register page
app.get('/register', (req, res) => {
  const userId = req.session['user_id'];
  const user = getUserById(userId, userDatabase);
  const templateVars = {
    user
  };
  res.render('register', templateVars);
});

// render login page
app.get('/login', (req, res) => {
  const userId = req.session['user_id'];
  const user = getUserById(userId, userDatabase);
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
  const user = getUserByEmail(email, userDatabase);
  const hashedPassword = user['password'];
  
  // invalid email
  if (!lookupEmail(email)) {
    res.status(403).send('Oh no, email not found.');
    return;
  // invalid password
  } else if (!bcrypt.compareSync(password, hashedPassword)) {
    res.status(403).send('Oh no, password doesn\'t match our records.');
    return;
  } else {
    const id = user['id'];
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
  const num = getNextNum(Math.max(...Object.keys(userDatabase)));
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
  userDatabase[num] = {
    id,
    email,
    password: hashedPassword
  };
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