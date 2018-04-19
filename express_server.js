
const cookieParser = require('cookie-parser');
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const bcrypt = require('bcrypt');
app.set("view engine", "ejs");
const bodyParser = require("body-parser");


app.use(function(req,res,next){
  console.log("the whole request", req.headers)
  next()
})

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());


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
    user: users[req.cookies.user_id],
  }
  if(templateVars.user){
    res.render("urls_new", templateVars);
  }else{
    res.render("login")
  }
});

app.get("/urls", (req, res) => {
  let templateVars = {
    user: users[req.cookies.user_id],
    urls: urlsForUserId(req.cookies.user_id)
  };
   console.log(users)
  res.render("urls_index", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    user: users[req.cookies.user_id],
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id]
  };
  res.render("urls_show", templateVars);
});

app.post("/urls/new", (req, res) => {
  var shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    url: req.body.longURL,
    userID: req.cookies.user_id
  }

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
  let userId = getId(users, "email", req.body.email);

  if (userId && users[userId].password == req.body.password){
    res.cookie('user_id', userId)
    res.redirect('/urls')
  }else {
    res.send("Error 403 wrong password or email")
  }
})

app.get("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
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

function getId(object, key, value){
  for (let id in object){
    if (object[id][key]==[value]) return id;
  }
}
function urlsForUserId(user_id){
  let urls = {};
  for(var short in urlDatabase){
    console.log(short)
    if(urlDatabase[short].userID == user_id){
      urls[short] = urlDatabase[short].url
    }
  }
  return urls
}


