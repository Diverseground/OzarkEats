const { restaurantSchema, reviewSchema, userSchema } = require('./schemas.js');
const ExpressError = require('./utils/ExpressError');
const Restaurant = require('./models/restaurant');
const Review = require('./models/review');
const User = require('./models/user');

module.exports.isNotVerified = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.isVerified) {
      return next();
    }
    req.flash(
      'error',
      'You must be verified first, please check your email to verify your account!'
    );
    return res.redirect('/');
  } catch (err) {
    req.flash('error', 'Something went wrong!');
    return res.redirect('/');
  }
};

module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl;
    req.flash('error', 'You must be signed in first!');
    return res.redirect('/login');
  }
  next();
};

module.exports.validateRestaurant = (req, res, next) => {
  const { error } = restaurantSchema.validate(req.body);
  console.log(req.body);
  if (error) {
    const msg = error.details.map((el) => el.message).join(',');
    throw new ExpressError(msg, 400);
  } else {
    next();
  }
};

module.exports.isAuthor = async (req, res, next) => {
  const { id } = req.params;
  const restaurant = await Restaurant.findById(id);
  if (!restaurant.author.equals(req.user._id)) {
    req.flash('error', 'You do not have permission to do that!');
    return res.redirect(`/campgrounds/${id}`);
  }
  next();
};

module.exports.isReviewAuthor = async (req, res, next) => {
  const { id, reviewId } = req.params;
  const review = await Review.findById(reviewId);
  if (!review.author.equals(req.user._id)) {
    req.flash('error', 'You do not have permission to do that!');
    return res.redirect(`/campgrounds/${id}`);
  }
  next();
};

module.exports.isUser = async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user.equals(req.user._id)) {
    req.flash('error', 'You do not have permission to do that!');
    return res.redirect(`/users/${id}`);
  }
  next();
};

module.exports.validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    const msg = error.details.map((el) => el.message).join(',');
    throw new ExpressError(msg, 400);
  } else {
    next();
  }
};
