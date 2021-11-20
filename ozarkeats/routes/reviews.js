const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  validateReview,
  isLoggedIn,
  isReviewAuthor,
  isNotVerified,
} = require('../middleware');
const Restaurant = require('../models/restaurant');
const Review = require('../models/review');
const reviews = require('../controllers/reviews');
const ExpressError = require('../utils/ExpressError');
const catchAsync = require('../utils/catchAsync');

router.post(
  '/',
  isLoggedIn,
  isNotVerified,
  validateReview,
  catchAsync(reviews.createReview)
);

router.delete(
  '/:reviewId',
  isLoggedIn,
  isNotVerified,
  isReviewAuthor,
  catchAsync(reviews.deleteReview)
);

module.exports = router;
