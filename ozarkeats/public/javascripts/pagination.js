const paginate = document.getElementById('paginate');
const restaurantContainer = document.getElementById('restaurants-container');
paginate.addEventListener('click', function (e) {
  e.preventDefault();
  fetch(this.href)
    .then((res) => res.json())
    .then((data) => {
      for (const restaurant of data.docs) {
        let template = generateRestaurant(restaurant);
        restaurantContainer.insertAdjacentHTML('beforeend', template);
      }
      let { nextPage } = data;
      this.href = this.href.replace(/page=\d+/, `page=${nextPage}`);
      restaurants.features.push(...data.docs);
      map.getSource('restaurants').setData(restaurants);
    })
    .catch((err) => console.log(err));
});

function generateRestaurant(restaurant) {
  let template = `<div class="card mb-3">
    <div class="row">
        <div class="col-md-4">
            <img class="img-fluid h-100 w-100" alt="" src="${
              restaurant.images.length
                ? restaurant.images[0].url
                : 'https://res.cloudinary.com/douqbebwk/image/upload/v1600103881/YelpCamp/lz8jjv2gyynjil7lswf4.png'
            }">
        </div>
        <div class="col-md-8">
            <div class="card-body">
                <h5 class="card-title">${restaurant.title} </h5>
    
                <p class="card-text">${restaurant.description}</p>
                <p class="card-text">
                    <small class="text-muted">${restaurant.location}</small>
                </p>
                <a class="btn btn-primary" href="/restaurants/${
                  restaurant._id
                }">View ${restaurant.title}</a>
            </div>
        </div>
    </div>
    </div>`;
  return template;
}
