
const PORT = process.env.PORT || 8080;
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const bodyParser = require("body-parser");
const express = require("express");
const methodOverride = require('method-override')

const app = express();

app.set("view engine", "ejs");

app.use(methodOverride("_method"));

app.use(cookieSession({
  name: 'session',
  keys: ["keyone","keytwo"],
  maxAge: 24 * 60 * 60 * 1000
}));

app.use(bodyParser.urlencoded({extended: true}));

let urlDatabase = {
  b2xVn2: {
    url: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  b2xSn2:{
    url: "http://www.lightshouselabs.ca",
    userID: "userRandomID2"
  }
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    hasedPassword: "purple-monkey-dinosaur"
  },
 user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    hashedPassword: "dishwasher-funk"
  },
  i4f8yb: {
    id: "adsfadfs",
    email: "user2@example.com",
    hashedPassword: "dishwasher-funk"
  }
};
 // -------------------------------------helper functions --------------------------------------------

function generateRandomString() {
  let randoString = "";
  while (randoString.length < 6){
//excluding CAPS because urls - is that actually an issue?
    const values = "abcdefghijklmnopqrstuvwxyz1234567890";
    randoString += values[Math.round(Math.random()*(values.length-1))];
  }
  return randoString;
}
// get id from database or return false
function getId(object, key, value) {
  for (const id in object){
    if (object[id][key] === value) return id;
  }
  return false;
}
//get urls for specific user
function urlsForUserId(user_id) {
  const urls = {};
  for (const short in urlDatabase) {
    if (urlDatabase[short].userID === user_id) {
      urls[short] = urlDatabase[short].url;
    }
  }
  return urls;
}

 // ---------------------------------------get requests -------------------------------------------------
app.get("/", (req, res) => {
// if logged in
  if (req.session.user_id) {
  res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/login", (req, res) => {
  if (req.session.user_id){
    res.redirect("/urls")
  }
  const templateVars = {
    user: users[req.session.user_id],
    urls: urlsForUserId(req.session.user_id)
  };
  res.render("login", templateVars);
});

app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    const templateVars = {
      user: users[req.session.user_id]
    };
  res.render("register", templateVars);
}
});

app.get("/u/:shortURL", (req, res) => {
  // if url exists in database
  if (urlDatabase[req.params.shortURL]) {
    const longURL = urlDatabase[req.params.shortURL].url;
    res.redirect(longURL);
  } else {
    res.status(404).send("<h1>Error: 404</h1> <p>url does not exist</p> <a href='/'>back</a>");
  }
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  }
  if (templateVars.user){
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login")
  }
});

app.get("/urls", (req, res) => {
  if (req.session.user_id){
  let templateVars = {
    user: users[req.session.user_id],
    urls: urlsForUserId(req.session.user_id)
  };
  res.render("urls_index", templateVars);
} else {
    res.status(401).send("<h1>Error: 401</h1> <p>login to view your urls</p> <a href='/'>login</a>")

}
});

app.get("/urls/:id", (req, res) => {
  const userUrls = urlsForUserId(req.session.user_id);
// if tinyurl exists
  if (urlDatabase[req.params.id]) {
// and logged in
    if (req.session.user_id) {
      let templateVars = {
      user: users[req.session.user_id],
      shortURL: req.params.id,
      urls: userUrls,
      error: ""
      };
// and has permission
      if (userUrls[req.params.id]) {
        res.render("urls_show", templateVars);
// else exists and does not have permission
      } else {
        templateVars = { ...templateVars, error: "error 401: Unauthorized, you can only edit urls you created." };
        res.render("urls_show", templateVars);
      }
// not logged in
    } else {
      res.status(401).send("<h1>Error: 401</h1> <p>login to view your urls</p> <a href='/'>login</a>");
    }
  }
// tinyurl does not exist
  else {
    res.status(404).send("<h1>Error: 404</h1> <p>tinyurl not found</p> <a href='/'>home</a>");
  }
});

// ------------------------------------------post requests ----------------------------------

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/');
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    url: req.body.longURL,
    userID: req.session.user_id
  }
  res.redirect('/urls');
});

app.delete("/urls/:id/delete",(req, res) => {
  const userUrls = urlsForUserId(req.session.user_id);
  if(urlDatabase[req.params.id]){
    // if logged in
    if(req.session.user_id){
      // and owns tinurl
      if(userUrls[req.params.id]){
        delete (urlDatabase[req.params.id]);
        res.redirect('/urls');
      // does not own tinyurl
      } else {
        res.status(401).send("<h1>Error: 401</h1> <p>Unauthorized, you can only edit urls you created</p> <a href='/'>login</a>");
      }
    // not logged in
    } else {
      res.status(401).send("<h1>Error: 401</h1> <p>login to view your urls</p> <a href='/'>login</a>")
    }
    // tiny url does not exist
  } else {
    res.status(404).send("<h1>Error: 404</h1> <p>tinyurl not found</p> <a href='/'>home</a>");
  }
})

app.put("/urls/:id",(req, res) => {
  if (urlDatabase[req.params.id]) {
    // if logged in
    if (req.session.user_id) {
      // if has access
      if (urlsForUserId(req.session.user_id)[req.params.id]){
        // update long url
        urlDatabase[req.params.id].url = req.body.newLongURL;
        res.redirect('/urls');
      }
    // not logged in
    } else {
      res.status(401).send("<h1>Error: 401</h1> <p>Unauthorized, you can only edit urls you created</p> <a href='/'>login</a>");
    }
  // tiny url does not exist
  } else {
    res.status(404).send("<h1>Error: 404</h1> <p>tinyurl not found</p> <a href='/'>home</a>");
  }
});

app.post("/login", (req, res) => {
// if user exists compare hashed passwords and set session-cookie
  const userId = getId(users, "email", req.body.email);
  if (userId && bcrypt.compareSync(req.body.password, users[userId].hashedPassword)){
    req.session.user_id = userId;
    res.redirect('/urls');
  } else {
    res.status(401).send("<h1>Error: 401</h1> <p>incorrect email or password</p> <a href='/login'>try again</a>");
  }
});

app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password ){
    res.status(400).send("<h1>Error: 400</h1> <p>provide email and password</p> <a href='/register'>try again</a>")
  } else if (getId(users, "email", req.body.email)){
    res.status(403).send("<h1>Error: 403</h1> <p>user already exists!</p> <a href='/login'>login</a> or <a href='/register'>try again</a>");
  } else {
    const userid = generateRandomString();
    users[userid] = {
      email: req.body.email,
      hashedPassword: bcrypt.hashSync(req.body.password, 10)
    }
   req.session.user_id = userid;
   res.redirect("/urls");
  }
});

app.listen(PORT, () => {
});



