"use strict";
(function() {     
    var map;
    var gmarkers = [];
    var infoBox = new InfoBox();
    
    // Instatiates map with traffic layer
    function initMap() {
        var mapOptions = {
            zoom: 12,
            center: {lat: 46.8, lng: -92.1}, 
            mapTypeId: 'terrain'
        };
        map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);         
        
        google.maps.event.addListener(map, 'click', function() {
            infoBox.close();
        });        
        
        // load event listener
        getAjaxData(map, "data/geotweets_merc3857.geo.json", "tweets");
        getAjaxData(map, "data/attractions_4326.geo.json", "attractions");
        
        // load ajax data using google api's method
//        map.data.loadGeoJson("data/geotweets_merc3857.geo.json"); 
////        map.data.loadGeoJson('data/attractions_merc3857.geo.json');
//        console.log(map.data.loadGeoJson("data/geotweets_merc3857.geo.json"));

        // add google traffic layer
        var trafficLayer = new google.maps.TrafficLayer();
        trafficLayer.setMap(map);
        
     };
    
    // Loads data using AJAX
    function getAjaxData(map, dataUrl, dataType) {
        // load the data
        $.ajax({
            url: dataUrl,  
            success: function(data) {
                parsePoints(data, dataType);
            },
            error: function(xhr, status, error) {
              alert("An AJAX error occured: " + status + "\nError: " + error);
            }            
        })
    };    
    
//    // Loads data using AJAX simpler version
//    function getAjaxData(map, dataUrl, dataType) {
//        // load the data
//        $.getJSON(dataUrl,  function(data) {
//            parsePoints(data)
//        })
//    };
    
    // Function to take geojson data to parse out geometries to create lat long coordinates 
    function parsePoints(data, dataType) {
        for (var i = 0; i < data.features.length; i++) {
            var name, html, pointLatLong;
            var itemProps = data.features[i].properties;

            if (dataType == "tweets") {
                name = itemProps.name;
                html = "<b>"+itemProps.name+"<\/b><br \/>"+itemProps.text+"<br/>title='"+ itemProps.screen_nam;
                pointLatLong = new google.maps.LatLng(itemProps.latitude, itemProps.longitude);
                // create the marker
                // category could be a different type of twitter item
                var marker = createMarker(pointLatLong, name, html, "tweets") //,category);         

            } else if (dataType = "attractions") {
                html = "<b>"+itemProps.name+"<\/b><br \/>"+itemProps.desc_+"<br/>title='"+ itemProps.name;
                var geom = data.features[i].geometry.coordinates;
                // the lat long were reversed. In google maps, it should be long, lat
                pointLatLong = new google.maps.LatLng(geom[1], geom[0]);
                // create the marker
                // category could be a different type of twitter item
                var marker = createMarker(pointLatLong, name, html, "attractions") //,category);
            };

            // category could be used if we want to categorize the types of tweets
    //                var category = item.cat;
        };
    };
    
    // Function to create a google marker and set up event window
    // from https://gist.github.com/phirework/4771983
    // removed "category" from function parameters since we don't categorize the tweets yet.
//    function createMarker(latlng, name, html, category) {
    function createMarker(latlng, name, html, category) {
        // block to make different marker symbols for the "dataType" parameter.
        if (category == "tweets") {
            var myIcon = {
                url:  'img/twitter_icon.svg',
//                anchor: new google.maps.Point(25,50),
                scaledSize: new google.maps.Size(40,40),
                fillOpacity: .6,
                strokeWeight: 1,
            }            
            var backgroundColor = "rgba(64,153,255,0.6)";
            
        } else if (category == "attractions") {
            var myIcon = {
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                scale: 3
            }
            var backgroundColor = "rgba(120,120,120, 0.6)";
        }        
        
        var boxText = document.createElement("div");
        boxText.style.cssText = "margin-top: 42px; background: " + backgroundColor + "; padding: 10px; border-radius: 10px; color: #fff";
        var fullContent = name 
        boxText.innerHTML = html;

        var myOptions = {
            content: boxText,
            disableAutoPan: false,
            maxWidth: 0,
            pixelOffset: new google.maps.Size(-100, 0),
            zIndex: null,
            boxStyle: { 
            //          background: "url('http://www.eyestagedit.com/wtda/assets/map/tip.png') no-repeat",
                width: "250px",
            },
            closeBoxURL: "",
            infoBoxClearance: new google.maps.Size(1, 1),
            isHidden: false,
            pane: "floatPane",
            enableEventPropagation: false
        };

        var marker = new google.maps.Marker({
            position: latlng,
            //        icon: category + ".png",
            icon: myIcon,
            map: map,
            title: name,
            zIndex: Math.round(latlng.lat()*-100000)<<5
        });
//        console.log(marker);

        // === Store the category and name info as a marker properties ===
        //      marker.mycategory = category;   
        marker.html = html
        marker.myname = name;
        gmarkers.push(marker);

        google.maps.event.addListener(marker, 'click', function() {
            infoBox.setOptions(myOptions)
            infoBox.open(map, this);
        });
    }; // end createMarker    
    
    
//    // Toggle layer on & off
//    function toggleLayer(map, layer) {
//        $(".layerbutton").click(function() {
//            if (map.hasLayer(layer)) {
//                map.removeLayer(layer);
//                $(".layerbutton").css("background-color", "gray");
//                $(".layerbutton h3 i").html("Off");
//            } else {
//                map.addLayer(layer);
//                $(".layerbutton").css("background-color", "green");
//                $(".layerbutton h3 i").html("On");            
//            };
//        });
//    };    
    
    $(document).ready(initMap);
    
})();