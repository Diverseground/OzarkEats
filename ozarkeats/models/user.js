const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const ImageSchema = new Schema({
  url: String,
  filename: String,
});

ImageSchema.virtual('thumbnail').get(function () {
  return this.url.replace('/upload', '/upload/w_400');
});

const opts = { toJSON: { virtuals: true } };

const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    emailToken: String,
    emailTokenExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    images: [ImageSchema],
    restaurants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Restaurant',
      },
    ],
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Review',
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    bio: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  opts
);

UserSchema.post('findByIdAndDelete', async function (doc) {
  if (doc) {
    await Review.deleteMany({
      _id: {
        $in: doc.reviews,
      },
    }),
      await Restaurant.deleteMany({
        _id: {
          $in: doc.restaurants,
        },
      });
  }
});

UserSchema.plugin(passportLocalMongoose);
UserSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('User', UserSchema);
