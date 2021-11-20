const express = require('express');
const router = express.Router();

const passport = require('passport');
const catchAsync = require('../utils/catchAsync');
const users = require('../controllers/users');
const { isLoggedIn, isUser, isNotVerified } = require('../middleware');
const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });
const { body } = require('express-validator');

router.route('/about').get(users.aboutPage);

router.get('/verify-email', users.verifyEmail);

router
  .route('/contact')
  .get(isLoggedIn, users.renderContactForm)
  .post(
    isLoggedIn,
    body('email').isEmail().normalizeEmail(),
    body('message').not().isEmpty().trim().escape(),
    body('name').not().isEmpty().trim().escape(),
    body('subject').not().isEmpty().trim().escape(),
    body('text').not().isEmpty().trim().escape(),
    users.contact
  );

router
  .route('/register')
  .get(users.renderRegister)
  .post(upload.array('image'), catchAsync(users.register));

router
  .route('/login')
  .get(users.renderLogin)
  .post(
    isNotVerified,
    passport.authenticate('local', {
      failureFlash: true,
      failureRedirect: '/login',
    }),
    users.login
  );

router.get('/logout', users.logout);

router
  .route('/forgot')
  .get(users.renderForgotPasswordForm)
  .post(users.forgotPassword);

router
  .route('/reset/:token')
  .get(users.renderResetPasswordForm)
  .post(users.resetPassword);

router.route('/users').get(isLoggedIn, isNotVerified, users.getAllUsers);
router
  .route('/users/:id')
  .get(isLoggedIn, catchAsync(users.renderUser))
  .put(isLoggedIn, isUser, upload.array('image'), catchAsync(users.updateUser))
  .delete(isLoggedIn, isUser, catchAsync(users.deleteUser));

router
  .route('/users/:id/edit')
  .get(isLoggedIn, isUser, users.renderEditUserForm);

module.exports = router;
