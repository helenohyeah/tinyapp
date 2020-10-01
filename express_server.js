// Packages
const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

// Helpers
const {
  generateRandomString,
  getUserByEmail,
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

// URL endpoints

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
// html handles not logged in state
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
// html handles not logged in state
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
    res.status(404).send(`Sorry, TinyURL ${shortURL} doesn't exist :(`);
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
    res.status(404).send(`Sorry, TinyURL '${shortURL}' doesn't exist :(`);
  }
});

// create a new short url given a long url
app.post('/urls', (req, res) => {
  const userId = req.session['user_id'];
  // logged in
  if (userId) {
    const shortURL = generateRandomString();
    const { longURL } = req.body;
    // adds short url to the db and associates it with the user
    urlDatabase[shortURL] = {
      longURL,
      userId
    };
    res.redirect(`/urls/${shortURL}`);
  // not logged in
  } else {
    res.status(401).send('Sorry, you must be logged in to create a Tiny URL.');
  }
});

// updates the long url of a given short url
app.post('/urls/:shortURL', (req, res) => {
  const userId = req.session['user_id'];
  const { shortURL } = req.params;
  // user logged in and owns the short url
  if (userId === urlDatabase[shortURL]['userId']) {
    const { longURL } = req.body;
    urlDatabase[shortURL]['longURL'] = longURL;
    res.redirect(`/urls/${shortURL}`);
  // user doesn't own the short url
  } else if (userId !== urlDatabase[shortURL][userId]) {
    res.status(401).send('Sorry, you don\'t have access to this Tiny URL.');
  // not logged in
  } else {
    res.status(401).send('Sorry, you must be logged in to edit a Tiny URL.');
  }
});

// deletes a shortURL given a shortURL
app.post('/urls/:shortURL/delete', (req, res) => {
  const userId = req.session['user_id'];
  const { shortURL} = req.params;
  // user logged in and owns the short url
  if (userId === urlDatabase[shortURL]['userId']) {
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  // user doesn't own the short url
  } else if (userId !== urlDatabase[shortURL][userId]) {
    res.status(401).send('Sorry, you don\'t have access to this Tiny URL.');
  // not logged in
  } else {
    res.status(401).send('Sorry, you must be logged in to delete a Tiny URL.');
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



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});