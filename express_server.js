const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const PORT = 8080; // default port 8080

app.use(bodyParser.urlencoded({extended: true}));

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

app.set("view engine", "ejs");

// renders home
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  res.render('urls_new');
})

app.get('/urls/:shortURL', (req, res) => {
  const templateVars = { 
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]
  };
  res.render('urls_show', templateVars);
});

// redirects request to the matching longURL
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});
// ***redirects to non-existent shortURL => /u/undefined, statusCode: 302 (Found)

// takes in new url forms and redirects to show new short and long URL
app.post('/urls', (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body['longURL'];
  res.redirect(`/urls/${shortURL}`);
});

// takes in delete request and removes entry then redirects
app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});
// ***request to non-existent shortURL => nothing happens, statusCode: 302 (Found)

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});