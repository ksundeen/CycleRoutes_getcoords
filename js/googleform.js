  var LATITUDE_ELEMENT_ID = "course_latitude";
  var LONGITUDE_ELEMENT_ID = "course_longitude";
  var MAP_DIV_ELEMENT_ID = "map-canvas";
//
//  var DEFAULT_ZOOM_WHEN_NO_COORDINATE_EXISTS = 1;
//  var DEFAULT_CENTER_LATITUDE = 22;
//  var DEFAULT_CENTER_LONGITUDE = 13;
//  var DEFAULT_ZOOM_WHEN_COORDINATE_EXISTS = 15;
//
//  // This is the zoom level required to position the marker
//  var REQUIRED_ZOOM = 15;
//
//  google.load("maps", "2.x");
//
//  // The google map variable
//  var map = null;
//
//  // The marker variable, when it is null no marker has been added
//  var marker = null;
//
//  function initializeGoogleMap() {
//    map = new google.maps.Map2(document.getElementById(MAP_DIV_ELEMENT_ID));
//    map.addControl(new GLargeMapControl());
//    map.addControl(new GMapTypeControl());
//
//    map.setMapType(G_NORMAL_MAP);

    var latitude = +document.getElementById(LATITUDE_ELEMENT_ID).value;
    var longitude = +document.getElementById(LONGITUDE_ELEMENT_ID).value;

    if(latitude != 0 && longitude != 0) {
      //We have some sort of starting position, set map center and marker
      map.setCenter(new google.maps.LatLng(latitude, longitude), DEFAULT_ZOOM_WHEN_COORDINATE_EXISTS);
      var point = new GLatLng(latitude, longitude);
      marker = new GMarker(point, {draggable:false});
      map.addOverlay(marker);
    } else {
      // Just set the default center, do not add a marker
      map.setCenter(new google.maps.LatLng(DEFAULT_CENTER_LATITUDE, DEFAULT_CENTER_LONGITUDE), DEFAULT_ZOOM_WHEN_NO_COORDINATE_EXISTS);
    }

    GEvent.addListener(map, "click", googleMapClickHandler);
  }


  function googleMapClickHandler(overlay, latlng, overlaylatlng) {

    if(map.getZoom() < REQUIRED_ZOOM) {
      alert("You need to zoom in more to set the location accurately." );
      return;
    }
    if(marker == null) {
      marker = new GMarker(latlng, {draggable:false});
      map.addOverlay(marker);
    }
    else {
      marker.setLatLng(latlng);
    }

    document.getElementById(LATITUDE_ELEMENT_ID).value = latlng.lat();
    document.getElementById(LONGITUDE_ELEMENT_ID).value = latlng.lng();

  }

  google.setOnLoadCallback(initializeGoogleMap);



</script>