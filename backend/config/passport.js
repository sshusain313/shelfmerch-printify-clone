const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const User = require('../models/User');

module.exports = function(passport) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback',
        proxy: true // Important for handling redirects through Nginx/proxies
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user exists
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            return done(null, user);
          } else {
            // Check if user exists with same email
            const email = profile.emails[0].value;
            user = await User.findOne({ email });

            if (user) {
              // Link google account
              user.googleId = profile.id;
              // Update avatar if not set
              if (!user.avatar) {
                user.avatar = profile.photos[0].value;
              }
              await user.save();
              return done(null, user);
            } else {
              // Create new user
              const newUser = {
                googleId: profile.id,
                name: profile.displayName,
                email: email,
                avatar: profile.photos[0].value,
                isEmailVerified: true, // Google emails are verified
                role: 'merchant' // Default role
              };

              user = await User.create(newUser);
              return done(null, user);
            }
          }
        } catch (err) {
          console.error(err);
          return done(err, null);
        }
      }
    )
  );

  // Serialize/Deserialize not strictly needed for JWT stateless auth 
  // but good practice if switching to sessions later or for passport completeness
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => done(err, user));
  });
};
