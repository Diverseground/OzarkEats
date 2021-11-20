const User = require('../models/user');
const Restaurant = require('../models/restaurant');
const Review = require('../models/review');
const { cloudinary } = require('../cloudinary');
const async = require('async');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

//'https://ozark-eats.herokuapp.com/';
module.exports.aboutPage = async (req, res) => {
  const user = await User.findOne({ username: 'Rootedfor' });
  res.render('utils/about', { user });
};

module.exports.renderContactForm = (req, res) => {
  res.render('utils/contact', {
    title: 'Contact Us',
    name: 'OzarkEats',
    email: 'ozarkeats@gmail.com',
  });
};

module.exports.contact = async (req, res) => {
  const { name, email, subject, message } = req.body;

  const mailOptions = {
    to: 'ozarkeats@gmail.com',
    from: email,
    subject: `OzarkEats Contact ${name}: ${subject}`,
    text: `${name} (${email}): ${message}`,
    html: `<h1><strong>${name} (${email}):</strong></h1>
    <p>${message}</p>`,
  };
  const smtpTransport = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'ozarkeats@gmail.com',
      pass: process.env.GMAILPW,
    },
  });
  smtpTransport.sendMail(mailOptions, function (err) {
    if (err) {
      console.log('Error occured');
      console.log(err.message);
      req.flash('error', 'Error occured');
      return res.redirect('/contact');
    }
    req.flash(
      'success',
      'Message sent! Thank you for sending us feedback. We will get back to you shortly'
    );
    return res.redirect('/restaurants');
  });
};

module.exports.renderRegister = (req, res) => {
  res.render('users/register');
};

module.exports.register = async (req, res, next) => {
  try {
    Object.assign(req.body.user, {
      emailToken: crypto.randomBytes(64).toString('hex'),
    });
    const { password } = req.body;
    const user = await new User(req.body.user);
    user.images = req.files.map((f) => ({
      url: f.path,
      filename: f.filename,
    }));
    const registeredUser = await User.register(
      user,
      password,
      async (err, user) => {
        if (err) {
          req.flash('error', err.message);
          return res.redirect('/register');
        }
        const smtpTransport = nodemailer.createTransport({
          service: 'Gmail',
          auth: {
            user: 'ozarkeats@gmail.com',
            pass: process.env.GMAILPW,
          },
        });
        const message = {
          to: user.email,
          from: 'ozarkeats@gmail.com',
          subject: 'OzarkEats - Email Verification',
          text: `Hello ${user.username}, Thank you for registering for our app.
          Please copy and paste the following link to verify your email associated with this account: 
          http://${req.headers.host}/verify-email?token=${user.emailToken}`,
          html: `<h1>Hello ${user.username}, Thank you for registering for our app.</h1>
          <p>Please click the following link to verify your email associated with this account:</p> 
          <p><a href="http://${req.headers.host}/verify-email?token=${user.emailToken}">Verify Your account</a></p>`,
        };

        try {
          await smtpTransport.sendMail(message, function (err) {
            if (err) {
              console.log(err);
              req.flash('error', 'Something went wrong');
              return res.redirect('/register');
            }
            req.flash(
              'success',
              'An email has been sent to your email address. Please verify your email to complete registration.'
            );
            return res.redirect('/login');
          });
        } catch (err) {
          console.log(err);
          req.flash(
            'error',
            'Something went wrong, please contact us at ozarkeats@gmail.com'
          );
          return res.redirect('/register');
        }
      }
    );
  } catch (err) {
    console.log(err);
    req.flash(
      'error',
      'Something went wrong, please contact us at ozarkeats@gmail.com'
    );
    return res.redirect('/register');
  }
};

module.exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    const user = await User.findOne({ emailToken: token });
    if (!user) {
      req.flash('error', 'Invalid token, please contact us for assistance');
      return res.redirect('/contact');
    }
    user.isVerified = true;
    user.emailToken = undefined;
    await user.save();
    req.login(user, async (err) => {
      if (err) return next(err);
      req.flash('success', `Welcome to OzarkEats ${user.username}!`);
      const redirectUrl = req.session.returnTo || '/about';
      delete req.session.returnTo;
      res.redirect(redirectUrl);
    });
  } catch (err) {
    console.log(err);
    req.flash(
      'error',
      'Something went wrong, please contact us for assistance'
    );
    return res.redirect('/contact');
  }
};

module.exports.renderLogin = (req, res) => {
  res.render('users/login');
};

module.exports.login = (req, res) => {
  req.flash('success', 'welcome back!');
  const redirectUrl = req.session.returnTo || '/restaurants';
  delete req.session.returnTo;
  res.redirect(redirectUrl);
};

module.exports.logout = (req, res) => {
  req.logout();
  req.flash('success', 'Goodbye!');
  res.redirect('/restaurants');
};

module.exports.renderForgotPasswordForm = (req, res) => {
  res.render('users/forgot');
};

module.exports.forgotPassword = (req, res, next) => {
  async.waterfall(
    [
      function (done) {
        crypto.randomBytes(20, function (err, buf) {
          const token = buf.toString('hex');
          done(err, token);
        });
      },
      function (token, done) {
        User.findOne({ email: req.body.email }, function (err, user) {
          if (!user) {
            req.flash('error', 'No account with that email address exists.');
            return res.redirect('/forgot');
          }

          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

          user.save(function (err) {
            done(err, token, user);
          });
        });
      },
      function (token, user, done) {
        const smtpTransport = nodemailer.createTransport({
          service: 'Gmail',
          auth: {
            user: 'ozarkeats@gmail.com',
            pass: process.env.GMAILPW,
          },
        });
        const mailOptions = {
          to: user.email,
          from: 'ozarkeats@gmail.com',
          subject: 'Password Reset',
          text:
            'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
            'http://' +
            req.headers.host +
            '/reset/' +
            token +
            '\n\n' +
            'If you did not request this, please ignore this email and your password will remain unchanged.\n',
        };
        smtpTransport.sendMail(mailOptions, function (err) {
          console.log('mail sent');
          req.flash(
            'success',
            'An e-mail has been sent to ' +
              user.email +
              ' with further instructions.'
          );
          done(err, 'done');
        });
      },
    ],
    function (err) {
      if (err) return next(err);
      res.redirect('/forgot');
    }
  );
};

module.exports.renderResetPasswordForm = (req, res) => {
  User.findOne(
    {
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    },
    function (err, user) {
      if (!user) {
        req.flash('error', 'Password reset token is invalid or has expired.');
        return res.redirect('/forgot');
      }
      res.render('users/reset', { token: req.params.token });
    }
  );
};

module.exports.resetPassword = (req, res) => {
  async.waterfall(
    [
      function (done) {
        User.findOne(
          {
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() },
          },
          function (err, user) {
            if (!user) {
              req.flash(
                'error',
                'Password reset token is invalid or has expired.'
              );
              return res.redirect('back');
            }
            if (req.body.password === req.body.confirm) {
              user.setPassword(req.body.password, function (err) {
                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;

                user.save(function (err) {
                  req.logIn(user, function (err) {
                    done(err, user);
                  });
                });
              });
            } else {
              req.flash('error', 'Passwords do not match.');
              return res.redirect('back');
            }
          }
        );
      },
      function (user, done) {
        const smtpTransport = nodemailer.createTransport({
          service: 'Gmail',
          auth: {
            user: 'ozarkeats@gmail.com',
            pass: process.env.GMAILPW,
          },
        });
        const mailOptions = {
          to: user.email,
          from: 'ozarkeats@gmail.com',
          subject: 'Your password has been changed',
          text:
            'Hello,\n\n' +
            'This is a confirmation that the password for your account ' +
            user.email +
            ' has just been changed.\n',
        };
        smtpTransport.sendMail(mailOptions, function (err) {
          req.flash('success', 'Success! Your password has been changed.');
          done(err);
        });
      },
    ],
    function (err) {
      res.redirect('/restaurants');
    }
  );
};

module.exports.getAllUsers = async (req, res) => {
  if (!req.query.page) {
    const users = await User.paginate({});

    res.render('users/index', { users });
  } else {
    const { page } = req.query;
    const users = await users.paginate(
      {},
      {
        page,
        limit: 10,
      }
    );
    res.status(200).json(users);
  }
};

module.exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const user = await User.findByIdAndUpdate(id, req.body.user, {
    new: true,
  });
  user.images = req.files.map((f) => ({
    url: f.path,
    filename: f.filename,
  }));
  await user.save();
  if (req.body.deleteImages) {
    for (let filename of req.body.deleteImages) {
      await cloudinary.uploader.destroy(filename);
    }
    await user.updateOne({
      $pull: { images: { filename: { $in: req.body.deleteImages } } },
    });
  }
  req.flash('success', 'Successfully updated your user!');
  res.redirect(`/users/${user._id}`);
};

module.exports.renderEditUserForm = (req, res) => {
  const { id } = req.params;
  User.findById(id, (err, user) => {
    if (err) return next(err);
    res.render('users/edit', { user });
  });
};
module.exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  const user = await User.findByIdAndDelete(id);
  await Review.deleteMany({ author: id });
  await Restaurant.deleteMany({ author: id });
  req.flash('success', 'User deleted successfully!');
  res.redirect('/');
};
module.exports.renderUser = async (req, res) => {
  const { id } = req.params;
  const restaurants = await Restaurant.find({ author: id });
  const user = await User.findById(id);
  res.render('users/profile', { user, restaurants });
};
