
const cookieSession = require('cookie-session')
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const bcrypt = require('bcrypt');
const bodyParser = require("body-parser");
app.set("view engine", "ejs");

app.use(cookieSession({
  name: 'session',
  keys: ["keyone","keytwo"],
  maxAge: 24 * 60 * 60 * 1000
}))


app.use(bodyParser.urlencoded({extended: true}));

let urlDatabase = {
  "b2xVn2": {
    url: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "b2xSn2":{
    url: "http://www.lightshouselabs.ca",
    userID: "userRandomID2"
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    hasedPassword: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    hashedPassword: "dishwasher-funk"
  },
  "i4f8yb": {
    id: "adsfadfs",
    email: "user2@example.com",
    hashedPassword: "dishwasher-funk"
  }
}

function generateRandomString() {
  let randoString = "";
  while(randoString.length < 6){
    let values = 'abcdefghijklmnopqrstuvwxyz1234567890';
    randoString += values[Math.round(Math.random()*(values.length-1))];
  }
  return randoString;
}
//get id from database or return false
function getId(object, key, value){
  for (const id in object){
    if (object[id][key] == [value]) return id;
  }
  return false;
}

function urlsForUserId(user_id){
  const urls = {};
  for (const short in urlDatabase){
    if (urlDatabase[short].userID == user_id){
      urls[short] = urlDatabase[short].url;
    }
  }
  return urls;
}

app.get("/", (req, res) => {
  if(req.session.user_id){
  res.redirect("/urls");
  } else {
    res.redirect("/login")
  }
});

app.get("/login", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id],
    urls: urlsForUserId(req.session.user_id)
  };
  res.render("login", templateVars);
});

app.get("/register", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  }
  res.render("register", templateVars)
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    let longURL = urlDatabase[req.params.shortURL].url;
    res.redirect(longURL);
  } else {
    res.send("Error: 400 Bad Request");
  }
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  }
  if(templateVars.user){
    res.render("urls_new", templateVars);
  }else{
    res.render("login")
  }
});

app.get("/urls", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id],
    urls: urlsForUserId(req.session.user_id)
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let userUrls = urlsForUserId(req.session.user_id);
  if(userUrls[req.params.id]){
    let templateVars = {
      user: users[req.session.user_id],
      shortURL: req.params.id,
      urls: userUrls
    };
    res.render("urls_show", templateVars);
}else {
  res.send("Error 403:  forbidden")
}
});

app.get("/logout", (req, res) => {
  req.session = null;
  res.redirect('/urls');
})

app.post("/urls/new", (req, res) => {
  var shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    url: req.body.longURL,
    userID: req.session.user_id
  }
  res.redirect('/urls');
});

app.post("/urls/:id/delete",(req, res) => {
 if(urlsForUserId(req.session.user_id)[req.params.id]){
   delete (urlDatabase[req.params.id]);
  res.redirect('/urls');
  }else{}
})

app.post("/urls/:id/update",(req, res) => {
  if(urlsForUserId(req.session.user_id).hasOwnProperty(req.params.id)){
    urlDatabase[req.params.id].url = req.body.newLongURL;
    res.redirect('/urls');
}else {
  res.redirect('/urls');
}
})

app.post("/login", (req, res) => {
  let userId = getId(users, "email", req.body.email);
  if (userId && bcrypt.compareSync(req.body.password, users[userId].hashedPassword)){
    req.session.user_id = userId;
    res.redirect('/urls');
  } else {
    res.send("Error 403 wrong password or email");
  }
})

app.post("/register", (req, res) => {
  if(!req.body.email || !req.body.password ){
    res.send('Error 400: empty forms! ')
  }else if (getId(users, "email", req.body.email)){
    res.send('Error 404: email already exists!');
  }else {
    let user_id = generateRandomString();
    let password = req.body.password;
    const hashedPassword = bcrypt.hashSync(password, 10);
    users[user_id] = {
      email: req.body.email,
      hashedPassword: hashedPassword
    }
   req.session.user_id = user_id;
   res.redirect("/urls")
  }
})

app.listen(PORT, () => {
});



