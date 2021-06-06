require("dotenv").config();
var express = require("express"),
  app = express(),
  bodyParser = require("body-parser"),
  mongoose = require("mongoose"),
  Campground = require("./models/campground"),
  Comment = require("./models/comment"),
  passport = require("passport"),
  LocalStrategy = require("passport-local"),
  User = require("./models/user"),
  methodOverride = require("method-override"),
  flash = require("connect-flash");
const httpServer = require("http").Server(app);
const io = require("socket.io")(httpServer);

// Requiring routes
var commentRoutes = require("./routes/comments"),
  campgroundRoutes = require("./routes/campgrounds"),
  indexRoutes = require("./routes/index");

mongoose.connect(process.env.DATABASEURL, { useNewUrlParser: true });

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());

// PASSPORT CONFIG
app.use(
  require("express-session")({
    secret: "shibas are the best dogs in the world.",
    resave: false,
    saveUninitialized: false,
  })
);
app.locals.moment = require("moment");
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function (req, res, next) {
  res.locals.currentUser = req.user;
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  next();
});

app.use("/", indexRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);

app.get("*", function (req, res) {
  res.render("error");
});

app.set("port", process.env.PORT || 3000);
app.set("ip", process.env.IP || "0.0.0.0");

//Start server
let server = httpServer.listen(app.get("port"), app.get("ip"), (err) => {
  if (err) {
    console.error(err + " Couldn't start the server, due to technical issue.");
  } else {
    let port = server.address().port;
    console.log("YelpCamp app is running on port " + port);
  }
});

const Message = require("./models/message");
const Conversation = require("./models/conversation");

exports = module.exports = function (io) {
  // Set socket.io listeners.
  io.on("connection", (socket) => {
    console.log("a user connected");

    // On conversation entry, join broadcast channel
    socket.on("enter conversation", (conversation) => {
      socket.join(conversation);
      console.log("joined " + conversation);
    });

    socket.on("leave conversation", (conversation) => {
      socket.leave(conversation);
      console.log("left " + conversation);
    });

    socket.on("new message", (conversation) => {
      io.sockets.in(conversation).emit("refresh messages", conversation);
    });

    socket.on("disconnect", () => {
      console.log("user disconnected");
    });
  });
};
