// routes/auth.routes.js
const router = require("express").Router();
const bcryptjs = require("bcryptjs");
const mongoose = require("mongoose");
const saltRounds = 10;
const User = require("../models/User.model");

const { isLoggedIn, isLoggedOut } = require("../middleware/route-guard.js");

// GET route ==> to display the signup form to users
router.get("/signup", isLoggedOut, (req, res) => res.render("settings"));
// POST route ==> to process form data
router.post("/signup", (req, res, next) => {
  const min = 10000; // Minimum 5-digit number (inclusive)
  const max = 99999; // Maximum 5-digit number (inclusive)
  const {
    firstName,
    lastName,
    email,
    password,
    gender,
    role,
    username,
    phoneNumber,
  } = req.body;
  //password atleast 6 chars
  // const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
  // if (!regex.test(password)) {
  //   res
  //     .status(500)
  //     .render('auth/signup', { errorMessage: 'Password needs to have at least 6 chars and must contain at least one number, one lowercase and one uppercase letter.' });
  //   return;
  // }

  // Custom validation

  if (!email || !email.trim() || !username) {
    return res.render("settings", {
      errorMessage: "Email or username is required.",
    });
  }
  if (!password || password.length < 6) {
    return res.render("settings", {
      errorMessage: "Password must be at least 6 characters.",
    });
  }
  if (!firstName || !firstName.trim()) {
    return res.render("settings", {
      errorMessage: "First Name is required.",
    });
  }

  if (!gender || !gender.trim()) {
    return res.render("settings", { errorMessage: "Gender is required." });
  }

  if (!phoneNumber) {
    return res.render("settings", {
      errorMessage: "Phone number is requires",
    });
  }

  bcryptjs
    .genSalt(saltRounds)
    .then((salt) => bcryptjs.hash(password, salt))
    .then((hashedPassword) => {
      User.create({
        username,
        firstName,
        lastName,
        email,
        gender,
        phoneNumber,
        role,
        passwordHash: hashedPassword,
        isAdmin: false,
        customerId:
          role === "Customer"
            ? Math.floor(Math.random() * (max - min + 1)) + min
            : " ",
      });
    })
    .then((userFromDB) => {
      // Registration successful
      successMessage("Newly created user is: ", userFromDB);
      res.status(200);
      // If successful

      if (req.session.currentUser.isAdmin) {
        res.render("settings", {
          user: req.session.currentUser,
          layout: "layout-admin",
          successMessage: "User created successfully",
        });
      } else {
        res.render("settings", {
          user: req.session.currentUser,
          layout: "layout",
        });
      }
    })
    .catch((error) => {
      if (error instanceof mongoose.Error.ValidationError) {
        res.status(500).render("setting", { errorMessage: error.message });
      } else if (error.code === 11000) {
        res.status(500).render("settings", {
          // errorMessage: 'User not found and/or incorrect password.'
          errorMessage:
            "Username and email need to be unique. Either username or email is already used. ",
        });
      } else {
        next(error);
      }
    });
});

//////////// L O G I N ///////////

// GET route ==> to display the login form to users
router.get("/login", (req, res, next) => {
  res.render("auth/login", { root: "views", layout: false });
});
// GET route ==> to display the login form to users
router.get("/auth/unauthorized", (req, res, next) => {
  res.render("auth/unauthorized", { root: "views", layout: false });
});

// POST login route ==> to process form data

router.post("/login", isLoggedOut, (req, res, next) => {
  const { user, password } = req.body;

  if ((!user ) || !password) {
    res.render("auth/login", {
      errorMessage:
        "Please enter either email or username and password to login.",
      layout: false,
    });
    return;
  }

  User.findOne({
    $or: [
      { email: { $regex: new RegExp(user, "i") } },
      { username: { $regex: new RegExp(user, "i") } },
    ],
  })
    .then((user) => {
      if (!user) {
        res.render("auth/login", {
          errorMessage: "Email or username not registered.",
          layout: false,
        });
        return;
      }
      // Check if the user is a customer, and prevent login if so.
      if (user.role === "Customer") {
        res.render("auth/unauthorized", {
          errorMessage:
            "Unauthorized access. Customers are not allowed to log in.",
          layout: false,
        });
        return;
      }
      // Password matches
      if (bcryptjs.compareSync(password, user.passwordHash)) {
        // Set the session data
        req.session.currentUser = user;

        //Check if the user is an admin
        if (user.isAdmin) {
          const isAdmin = true;

          req.session.currentUser = user;
          res.render("index", {
            user,
            isAdmin: isAdmin,
            layout: "layout-admin",
          });
        } else {
          // Regular user, render their profile
          res.render("index", { user, isAdmin: false, layout: "layout" });
        }
      } else {
        res.render("auth/login", {
          errorMessage: "User not found and/or incorrect password.",
          layout: false,
        });
      }
    })
    .catch((error) => next(error));
});

router.post("/logout", isLoggedIn, (req, res, next) => {
  req.session.destroy((err) => {
    if (err) next(err);
    res.redirect("/login");
  });
});
module.exports = router;
