const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 8080; // default port 8080

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

// hardcoded 'database'
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
  "43hb2E": "http://www.spotify.com"
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

app.get("/", (req, res) => {
  res.redirect("/urls");
});

// browse home page
app.get("/urls", (req, res) => {
  const templateVars = { 
    urls: urlDatabase,
    username: req.cookies['username'] 
  };
  res.render('urls_index', templateVars);
});

// browse create a new url page
app.get('/urls/new', (req, res) => {
  const templateVars = {
    username: req.cookies['username']
  }
  res.render('urls_new', templateVars);
});

// browse individual short url page
app.get('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  const templateVars = {
    shortURL,
    longURL,
    username: req.cookies['username'] 
  };
  res.render('urls_show', templateVars);
});

// redirector that takes the short url and sends user to the matching longURL
app.get('/u/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  res.redirect(longURL || '/*');
});

// catch all
app.get('*', (req, res) => {
  res.status(404).send('404 Not Found :(');
});

app.post('/login', (req, res) => {
  const value = req.body['username'];
  res.cookie('username', value);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('urls');
});

// takes in new url forms and redirects to show new short and long URL
app.post('/urls', (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body['longURL'];
  urlDatabase[shortURL] = longURL;
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
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});