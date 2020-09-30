const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 8080; // default port 8080

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

// hardcoded url data
// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com",
//   "43hb2E": "http://www.spotify.com"
// };

const urlDatabase = {
  'b2xVn2': { longURL: 'http://www.lighthouselabs.ca', userId: '42hb2E' },
  '9sm5xK': { longURL: 'http://www.google.com', userId: '42hb2E' },
  '43hb2E': { longURL: 'http://www.spotify.com', userId: '9sDexK' }
}

// hardcoded user data
const users = { 
  "1": {
    id: "42hb2E", 
    email: "helen@email.com", 
    password: "password"
  },
 "2": {
    id: "9sDexK", 
    email: "melon@example.com", 
    password: "internet"
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

app.get("/", (req, res) => {
  res.redirect("/urls");
});

// browse home page
app.get("/urls", (req, res) => {
  const userId = req.cookies['user_id'];
  const user = getUserObjById(userId);
  const templateVars = { 
    urls: urlDatabase,
    user
  };
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

// browse individual short url page
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
  res.render('urls_show', templateVars);
});

// redirector that takes the short url and sends user to the matching longURL
app.get('/u/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL]['longURL'];
  res.redirect(longURL || '/*');
});

// browse and render register page
app.get('/register', (req, res) => {
  const userId = req.cookies['user_id'];
  const user = getUserObjById(userId);
  const templateVars = {
    user
  }
  res.render('register', templateVars);
});

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
    res.status(403).send('Oh no, email not found!');
    return;
  } else if (!verifyPassword(email, password)) {
    res.status(403).send('Oops, password doesn\'t match our records');
    return;
  } else {
    const user = getUserObjByEmail(email);
    res.cookie('user_id', user['id']);
    res.redirect('/urls');
  }
  // sets cookie using userid
  
  // const value = req.body['username'];
  // res.cookie('username', value);
  // res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('urls');
});

app.post('/register', (req, res) => {
  const num = getNextNum(Math.max(...Object.keys(users)));
  const id = generateRandomString();
  const email = req.body['email'];
  const password = req.body['password'];

  if (email === '' || password === '') {
    res.status(400).send('Oops missing email and/or password!');
    return;
  } else if (lookupEmail(email)) {
    res.status(400).send('Oops email already exists!');
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

// takes in new url forms and redirects to show new short and long URL
app.post('/urls', (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body['longURL'];
  urlDatabase[shortURL]['longURL'] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

// takes in delete request and removes entry then redirects
app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

// updates a url in the database
app.post('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body['id'];
  urlDatabase[shortURL]['longURL'] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});