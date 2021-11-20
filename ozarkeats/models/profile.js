const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ImageSchema = new Schema({
  url: String,
  filename: String,
});

ImageSchema.virtual('thumbnail').get(function () {
  return this.url.replace('/upload', '/upload/w_400');
});

const opts = { toJSON: { virtuals: true } };

const ProfileSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    images: [ImageSchema],
    bio: {
      type: String,
    },
    author: {
      type: String,
    },
    campgrounds: {
      type: Schema.Types.ObjectId,
      ref: 'Campground',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  opts
);

module.exports = mongoose.model('Profile', ProfileSchema);
