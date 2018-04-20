
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

const error = {
  400: "Bad Request ",
  401: "Unauthorized ",
  403: "Forbidden ",
  404: "not Found"
}

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
 //helper functions ---------------------------------------------------------------------------------------------------------------------------

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
//get urls for specific user
function urlsForUserId(user_id){
  const urls = {};
  for (const short in urlDatabase){
    if (urlDatabase[short].userID == user_id){
      urls[short] = urlDatabase[short].url;
    }
  }
  return urls;
}

 //get requests -----------------------------------------------------------------------------------

app.get("/", (req, res) => {
  if(req.session.user_id){
  res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/login", (req, res) => {
  if(req.session.user_id){
    res.redirect("/urls")
  }
  let templateVars = {
    user: users[req.session.user_id],
    urls: urlsForUserId(req.session.user_id)
  };
  res.render("login", templateVars);
});

app.get("/register", (req, res) => {
  if (req.session.user_id){
    res.redirect("/urls");
  } else {
  let templateVars = {
    user: users[req.session.user_id]
  }
  res.render("register", templateVars)
}
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    let longURL = urlDatabase[req.params.shortURL].url;
    res.redirect(longURL);
  } else {
    res.send("<h1>Error: 400</h1> <p>url does not exist</p> <a href='/'>back</a>");
  }
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  }
  if(templateVars.user){
    res.render("urls_new", templateVars);
  }else{
    res.redirect("/login")
  }
});

app.get("/urls", (req, res) => {
  if(req.session.user_id){
  let templateVars = {
    user: users[req.session.user_id],
    urls: urlsForUserId(req.session.user_id)
  };
  res.render("urls_index", templateVars);
} else {
    res.send("<h1>Error: 401</h1> <p>login to view your urls</p> <a href='/'>login</a>")

}
});

app.get("/urls/:id", (req, res) => {
  let userUrls = urlsForUserId(req.session.user_id);
  if(urlDatabase[req.params.id]){
    let templateVars = {
      user: users[req.session.user_id],
      shortURL: req.params.id,
      urls: userUrls,
      error: ""
    };
    if(userUrls[req.params.id]){
      res.render("urls_show", templateVars);
    } else {
      //include erorr in urls_show if user is not authorized
        templateVars = {...templateVars, error: "error 401: Unauthorized, you can only edit urls you created."}
      res.render("urls_show", templateVars);
      }
  } else {
    res.redirect("/urls");
  }
});

//post requests -----------------------------------------------------------------------------------

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/');
})

app.post("/urls", (req, res) => {
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
  }else{
    res.send(error[""])
  }
})

app.post("/urls/:id",(req, res) => {
  if(urlsForUserId(req.session.user_id).hasOwnProperty(req.params.id)){
    urlDatabase[req.params.id].url = req.body.newLongURL;
    res.redirect('/urls');
}else {
  res.send("<h1>Error: 401</h1> <p>login to access your urls</p> <a href='/login'>login</a>");
}
})

app.post("/login", (req, res) => {
  let userId = getId(users, "email", req.body.email);
  if (userId && bcrypt.compareSync(req.body.password, users[userId].hashedPassword)){
    req.session.user_id = userId;
    res.redirect('/urls');
  } else {
    res.send("<h1>Error: 401</h1> <p>incorrect email or password</p> <a href='/login'>try again</a>");
  }
})

app.post("/register", (req, res) => {
  if(!req.body.email || !req.body.password ){
    res.send('Error 400: empty forms! ')
  }else if (getId(users, "email", req.body.email)){
    res.send("<h1>Error: 404</h1> <p>user already exists!</p> <a href='/register'>try again</a>");
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



