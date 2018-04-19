
const cookieParser = require('cookie-parser');
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
app.set("view engine", "ejs");
const bodyParser = require("body-parser");


app.use(function(req,res,next){
  console.log("the whole request", req.headers)
  next()
})

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());


let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  },
  "i4f8yb": {
    id: "adsfadfs",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}
app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  //console.log(user)
  let templateVars = {
    user: users[req.cookies.user_id]
  }
  res.render("register", templateVars)
});

app.get("/u/:shortURL", (req, res) => {
  console.log()
  let longURL = urlDatabase[req.params.shortURL]
  res.redirect(longURL);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    username: req.cookies["username"]
  }
  res.render("urls_new", templateVars);
});

app.get("/urls", (req, res) => {
  let templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase
  };
  // console.log(templateVars)
  res.render("urls_index", templateVars);
});
app.get("/urls/:id", (req, res) => {
  let templateVars = {
    username: req.cookies["username"],
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id]
  };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  var shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;

  console.log(urlDatabase);  // debug statement to see POST parameters
  res.redirect('/urls');        // Respond with 'Ok' (we will replace this)
});

app.post("/urls/:id/delete",(req, res) => {
  delete (urlDatabase[req.params.id])
  res.redirect('/urls')
})

app.post("/urls/:id/update",(req, res) => {
  urlDatabase[req.params.id] = req.body.newLongURL;
  console.log(req.body)
  res.redirect('/urls')
})

app.post("/login", (req, res) => {
  console.log(req.body.username)
  res.cookie('username', req.body.username)
  res.cookies('password', req.body.password)
  res.redirect('/urls')
})

app.post("/logout", (req, res) => {
  console.log(req.body.username)
  res.clearCookie('username')
  res.redirect('/urls')
})

app.post("/register", (req, res) => {

  if(!req.body.email || !req.body.password ){
    res.send('Error 400: empty forms! ')

  }else if (contains(users, "email", req.body.email)){
    res.send('Error 404: email already exists!');
  }else {
  let user_id = generateRandomString();
  users[user_id] = {
    email: req.body.email,
    password: req.body.password
  }
  res.cookie("user_id", user_id)
  res.redirect("/urls")
}

})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
let randoString = "";
while(randoString.length < 6){
  let values = 'abcdefghijklmnopqrstuvwxyz1234567890';
  randoString += values[Math.round(Math.random()*(values.length-1))];
}
return randoString;
}

function contains(object,key, item){
  for(let id in object){
    if (object[id][key] == item) return true
  }
return false;
}


