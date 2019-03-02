var place_location;
var options = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0
};

function success(pos) {
  var crd = pos.coords;
   var place_location={
          latitude:crd.latitude,
          longitude:crd.longitude
          document.getElementById()
  }
  console.log('Your current position is:');
  console.log(`Latitude : ${crd.latitude}`);
  console.log(`Longitude: ${crd.longitude}`);
  console.log(`More or less ${crd.accuracy} meters.`);
}

function error(err) {
  console.warn(`ERROR(${err.code}): ${err.message}`);
}

navigator.geolocation.getCurrentPosition(success, error, options);


function geocodeLatLng(geocoder, map, infowindow) {
        // var input = lo
        // var latlngStr = input.split(',', 2);
        var latlng = {lat: parseFloat(place_location.latitude), lng: parseFloat(place_location.longitude)};
        geocoder.geocode({'location': latlng}, function(results, status) {
          if (status === 'OK') {
            if (results[0]) {
              console.log(results)
              // map.setZoom(11);
              // var marker = new google.maps.Marker({
              //   position: latlng,
              //   map: map
              // });
              // infowindow.setContent(results[0].formatted_address);
              // infowindow.open(map, marker);
            } else {
              window.alert('No results found');
            }
          } else {
            window.alert('Geocoder failed due to: ' + status);
          }
        });
}