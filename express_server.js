const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 8080; // default port 8080

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

// hardcoded url data
const urlDatabase = {
  'b2xVn2': { longURL: 'http://www.lighthouselabs.ca', userId: '42hb2E' },
  '9sm5xK': { longURL: 'http://www.google.com', userId: '42hb2E' },
  '43hb2E': { longURL: 'http://www.spotify.com', userId: '9sDexK' }
}

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

const verifyPassword = (email, password) => {
  let userObj = {};
  for (const user in users) {
    if (users[user]['email'] === email) userObj = users[user];
  }
  return (userObj['password'] === password) ? true : false;
};

const getUserObjByEmail = (email) => {
  for (const user in users) {
    if (users[user]['email'] === email) return users[user];
  }
};

const getUrlsById = (id) => {
  const urls = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url]['userId'] === id) urls[url] = urlDatabase[url];
  }
  return urls;
};

app.get("/", (req, res) => {
  res.redirect("/urls");
});

// browse urls that the user created only if user is logged in
app.get("/urls", (req, res) => {
  const userId = req.cookies['user_id'];
  const user = getUserObjById(userId);
  const urls = getUrlsById(userId);
  const templateVars = { 
    urls,
    user
  };
  if (user === undefined) {
    res.redirect('/login');
    return;
  }
  res.render('urls_index', templateVars);
});

// browse create a new url page only if user is logged in
app.get('/urls/new', (req, res) => {
  const userId = req.cookies['user_id'];
  const user = getUserObjById(userId);
  const templateVars = {
    user
  }
  if (user === undefined) {
    res.redirect('/login');
    return;
  }
  res.render('urls_new', templateVars);
});

// browse individual short url page and allow user to edit only if user is logged in
// ## ISSUE: any user can modify any shortURL page
app.get('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL]['longURL'];
  const userId = req.cookies['user_id'];
  const user = getUserObjById(userId);
  const templateVars = {
    shortURL,
    longURL,
    user
  };
  if (user === undefined) {
    res.redirect('/login');
    return;
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
  const userId = req.cookies['user_id'];
  const user = getUserObjById(userId);
  const templateVars = {
    user
  }
  res.render('register', templateVars);
});

// render login page
app.get('/login', (req, res) => {
  const userId = req.cookies['user_id'];
  const user = getUserObjById(userId);
  const templateVars = {
    user
  }
  res.render('login', templateVars);
});

// catch all
app.get('*', (req, res) => {
  res.status(404).send('404 Not Found :(');
});

// login using email and password and sets a cookie
// handles invalid email and password cases
app.post('/login', (req, res) => {
  const email = req.body['email'];
  const password = req.body['password'];

  if (!lookupEmail(email)) {
    res.status(403).send('Oh no, email not found.');
    return;
  } else if (!verifyPassword(email, password)) {
    res.status(403).send('Oh no, password doesn\'t match our records.');
    return;
  } else {
    const user = getUserObjByEmail(email);
    res.cookie('user_id', user['id']);
    res.redirect('/urls');
  }
});

// logout and clear cookies
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('urls');
});

// register with email and password
// handles empty email or password, email already exists
app.post('/register', (req, res) => {
  const num = getNextNum(Math.max(...Object.keys(users)));
  const id = generateRandomString();
  const email = req.body['email'];
  const password = req.body['password'];

  if (email === '' || password === '') {
    res.status(400).send('Oh no, empty email and/or password.');
    return;
  } else if (lookupEmail(email)) {
    res.status(400).send('Oops, that email already exists.');
    return;
  }
  users[num] = {
    id,
    email,
    password
  };
  res.cookie('user_id', id);
  res.redirect('/urls');
});

// creates a new shortURL given a longURL
app.post('/urls', (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body['longURL'];
  const userId = req.cookies['user_id'];
  urlDatabase[shortURL] = { 
    longURL,
    userId
  };
  res.redirect(`/urls/${shortURL}`);
});

// deletes a shortURL given the shortURL to delete then redirects to home
app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

// updates the longURL of a given shortURL
app.post('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body['id'];
  urlDatabase[shortURL]['longURL'] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});