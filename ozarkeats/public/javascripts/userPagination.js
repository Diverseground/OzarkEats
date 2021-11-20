const paginate = document.getElementById('paginate');
const usersContainer = document.getElementById('users-container');
paginate.addEventListener('click', function (e) {
  e.preventDefault();
  fetch(this.href)
    .then((res) => res.json())
    .then((data) => {
      for (const user of data.docs) {
        let template = generateUser(user);
        usersContainer.insertAdjacentHTML('beforeend', template);
      }
      let { nextPage } = data;
      this.href = this.href.replace(/page=\d+/, `page=${nextPage}`);
    })
    .catch((err) => console.log(err));
});

function generateUser(user) {
  let template = `
  <div class="card mb-4">
  <div class="row">
      <div class="col-md-4">
          <img class="img-fluid" width="200" alt=""
              src="${
                user.images.length
                  ? user.images[0].url
                  : 'https://res.cloudinary.com/douqbebwk/image/upload/v1600103881/YelpCamp/lz8jjv2gyynjil7lswf4.png'
              }">
      </div>
      <div class="col-md-8">
          <div class="card-body">
              <h5 class="card-title">${user.username}  </h5>
              <p class="card-text">${user.createdAt}</p>
              <a href="/users/${
                user._id
              }" class="btn btn-primary">View Profile</a>
          </div>
      </div>
  </div>
</div>`;
  return template;
}
