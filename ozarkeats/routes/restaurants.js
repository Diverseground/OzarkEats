const express = require('express');
const router = express.Router();
const restaurants = require('../controllers/restaurants');
const catchAsync = require('../utils/catchAsync');
const {
  isLoggedIn,
  isAuthor,
  validateRestaurant,
  isNotVerified,
} = require('../middleware');
const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });

const Restaurant = require('../models/restaurant');

router
  .route('/')
  .get(catchAsync(restaurants.index))
  .post(
    isLoggedIn,
    isNotVerified,
    upload.array('image'),
    validateRestaurant,
    catchAsync(restaurants.createRestaurant)
  );
router.get('/search', catchAsync(restaurants.searchRestaurants));
router.get('/new', isLoggedIn, isNotVerified, restaurants.renderNewForm);
router.route('/random').get(restaurants.generateRestaurant);

router
  .route('/:id')
  .get(catchAsync(restaurants.showRestaurant))
  .put(
    isLoggedIn,
    isNotVerified,
    isAuthor,
    upload.array('image'),
    validateRestaurant,
    catchAsync(restaurants.updateRestaurant)
  )
  .delete(
    isLoggedIn,
    isNotVerified,
    isAuthor,
    catchAsync(restaurants.deleteRestaurant)
  );

router.get(
  '/:id/edit',
  isLoggedIn,
  isNotVerified,
  isAuthor,
  catchAsync(restaurants.renderEditForm)
);

module.exports = router;
