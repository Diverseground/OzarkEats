mapboxgl.accessToken = mapToken;
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/diversifiedground/ckw3xn4s80uxu15oftho30639', // stylesheet location
  center: restaurant.geometry.coordinates, // starting position [lng, lat]
  zoom: 10, // starting zoom
});

map.addControl(new mapboxgl.NavigationControl());

const marker1 = new mapboxgl.Marker({ color: '#FFC600' })
  .setLngLat(restaurant.geometry.coordinates)
  .setPopup(
    new mapboxgl.Popup({ offset: 25 }).setHTML(
      `<h3>${restaurant.title}</h3><p>${restaurant.location}</p>`
    )
  )
  .addTo(map);
