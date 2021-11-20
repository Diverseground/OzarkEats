const Restaurant = require('../models/restaurant');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapboxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapboxToken });
const { cloudinary } = require('../cloudinary');
const Review = require('../models/review');

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

module.exports.index = async (req, res) => {
  if (!req.query.page) {
    const allRestaurants = await Restaurant.find({});
    const restaurants = await Restaurant.paginate({});

    res.render('restaurants/index', { restaurants, allRestaurants });
  } else {
    const { page } = req.query;
    const allRestaurants = await Restaurant.find({});
    const restaurants = await Restaurant.paginate(
      {},
      {
        page,
        limit: 10,
      }
    );
    res.status(200).json(restaurants);
  }
};

module.exports.searchRestaurants = async (req, res) => {
  if (!req.query.search) {
    return res.redirect('/restaurants');
  } else {
    const regex = new RegExp(escapeRegex(req.query.search), 'gi');

    const restaurants = await Restaurant.find({
      $or: [{ title: regex }, { description: regex }, { location: regex }],
    });

    if (restaurants.length < 1) {
      req.flash('error', 'No restaurants found!');
      return res.redirect('/restaurants');
    }
    res.render('restaurants/search', { restaurants });
  }
};
module.exports.renderNewForm = (req, res) => {
  res.render('restaurants/new');
};

module.exports.createRestaurant = async (req, res, next) => {
  const geoData = await geocoder
    .forwardGeocode({
      query: req.body.restaurant.location,
      limit: 1,
    })
    .send();
  const restaurant = new Restaurant(req.body.restaurant);
  restaurant.geometry = geoData.body.features[0].geometry;
  restaurant.images = req.files.map((f) => ({
    url: f.path,
    filename: f.filename,
  }));
  restaurant.author = req.user._id;
  await restaurant.save();
  req.flash('success', 'Successfully made a new restaurant!');
  res.redirect(`/restaurants/${restaurant._id}`);
};

module.exports.showRestaurant = async (req, res) => {
  const { id } = req.params;
  const restaurant = await Restaurant.findById(id)
    .populate({
      path: 'reviews',
      populate: {
        path: 'author',
      },
    })
    .populate('author');
  if (!restaurant) {
    req.flash('error', 'Cannot find that restaurant!');
    return res.redirect('/restaurants');
  }
  res.render('restaurants/show', { restaurant });
};

module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const restaurant = await Restaurant.findById(id);
  if (!restaurant) {
    req.flash('error', 'Cannot find that restaurant!');
    return res.redirect('/restaurants');
  }
  res.render('restaurants/edit', { restaurant });
};

module.exports.updateRestaurant = async (req, res) => {
  const { id } = req.params;
  const restaurant = await Restaurant.findByIdAndUpdate(id, {
    ...req.body.restaurant,
  });
  const imgs = req.files.map((f) => ({ url: f.path, filename: f.filename }));
  restaurant.images.push(...imgs);
  await restaurant.save();
  if (req.body.deleteImages) {
    for (let filename of req.body.deleteImages) {
      await cloudinary.uploader.destroy(filename);
    }
    await restaurant.updateOne({
      $pull: { images: { filename: { $in: req.body.deleteImages } } },
    });
  }
  req.flash('success', 'Successfully updated restaurant!');
  res.redirect(`/restaurants/${restaurant._id}`);
};

module.exports.deleteRestaurant = async (req, res) => {
  const { id } = req.params;
  await Restaurant.findByIdAndDelete(id);

  req.flash('success', 'Successfully deleted restaurant');
  res.redirect('/restaurants');
};

module.exports.generateRestaurant = async (req, res) => {
  const restaurants = await Restaurant.find({});
  if (!restaurants || restaurants.length < 1) {
    req.flash('error', 'No restaurants to generate!');
    return res.redirect('/restaurants');
  }
  const randomRestaurant =
    restaurants[Math.floor(Math.random() * restaurants.length)];
  if (!randomRestaurant) {
    req.flash('error', 'No restaurants to generate!');
    return res.redirect('/restaurants');
  }
  res.redirect(`/restaurants/${randomRestaurant._id}`);
};
