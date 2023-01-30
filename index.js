require("dotenv").config(".env");
const cors = require("cors");
const express = require("express");
const app = express();
const morgan = require("morgan");
const { PORT = 3000 } = process.env;

// TODO - require express-openid-connect and destructure auth from it
const { auth } = require("express-openid-connect");
const { User, Cupcake } = require("./db");
const { OPEN_READWRITE } = require("sqlite3");

const { MY_SECRET, MY_AUDIENCE, MY_CLIENT_ID, MY_BASE_URL } = process.env;

// middleware
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// define the config object
const config = {
  authRequired: true,
  auth0Logout: true,
  secret: MY_SECRET,
  baseURL: MY_AUDIENCE,
  clientID: MY_CLIENT_ID,
  issuerBaseURL: MY_BASE_URL,
};

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config)); //This is when we will initialize our connection to OpenID Connect. This grants the user access to their OIDC.

//User middleware to save their information to the database
app.use(async (req, res, next) => {
  const [user] = await User.findOrCreate({
    where: {
      username:req.oidc.user.nickname,
      name: req.oidc.user.name,
      email:req.oidc.user.email,
    },
  });
  console.log(user);
  next();
});

// Creates a GET handler that sends back whether the user is Logged in or Logged Out
//req.isAuthenticated is provided from the auth router
app.get("/", (req, res) => {
  console.log(req.oidc.user);
  res.send(
    req.oidc.isAuthenticated()
      ? `<h2 align="center">CryptoCupcakesAPI</h2>
  <h2 align="center">Welcome, ${req.oidc.user.name}</h2>
  <p align="center">Username: ${req.oidc.user.nickname}</p>
  <p align="center">Email: ${req.oidc.user.email}</p>
   <img src="${req.oidc.user.picture}" alt="${req.oidc.user.name}>"`
      : "Logged out"
  );
  // The above lines 37-44
});

app.get("/cupcakes", async (req, res, next) => {
  try {
    const cupcakes = await Cupcake.findAll();
    res.send(cupcakes);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// error handling middleware
app.use((error, req, res, next) => {
  console.error("SERVER ERROR: ", error);
  if (res.statusCode < 400) res.status(500);
  res.send({ error: error.message, name: error.name, message: error.message });
});

app.listen(PORT, () => {
  console.log(`Cupcakes are ready at http://localhost:${PORT}`);
});
