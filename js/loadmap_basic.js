"use strict";
(function() {     
    var map;
    var gmarkersTweets = [];
    var gmarkersAttractions = [];
    var infoBox = new InfoBox();
    
    // global variable for holding starting & ending lat long
    var startLatLong = [];
    console.log("startLatLong starting: ", startLatLong);
    var endLatLong = [];
    console.log("endLatLong starting: ", endLatLong);

    // Instatiates map with traffic layer, layers, and panels
    function initMap() {
        var mapOptions = {
            zoom: 12,
            center: {lat: 46.8, lng: -92.1}, 
            mapTypeId: 'terrain'
        };
        map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);  
        
        google.maps.event.addListener(map, 'click', function(event) {
            // close infoBox if opened
            infoBox.close();    
        });        
        
        var tweets = getAjaxData(map, "data/geotweets_merc3857.geo.json", "tweets", "layerOff", gmarkersTweets);
        var attractions = getAjaxData(map, "data/attractions_4326.geo.json", "attractions", "layerOn", gmarkersAttractions);
        
        // add google traffic layer
        var trafficLayer = new google.maps.TrafficLayer();
        trafficLayer.setMap(map);     
        makeNavigationMarker(map, "Start");
//        makeNavigationMarker(map, "Destination");
     };
    
    /*
    Attaches a click event to the map and creates a basic marker onclick, and then when user clicks again the marker is removed.
    @param map: google maps google.maps.Map object.
    @param navStatus: "Start" or "Destination" for whether the marker object created is the starting or ending position of the track.
    */
    function makeNavigationMarker(map, navStatus) {
        google.maps.event.addListener(map, 'click', function(event) {    
            var latitude = event.latLng.lat();
            var longitude = event.latLng.lng();            
            var latLongOut = [latitude, longitude];
            // Place a draggable marker on the map
            // set colors for start/end
            if (navStatus == "Start") {
                var newUrl = 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
                // populate global variable for lat longs    
                writeLatLongToElement(latLongOut, "startbox");                
            } else if (navStatus == "Destination") {
                // populate global variable for lat longs
                var newUrl = 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
                endLatLong = [longitude, latitude];         
                writeLatLongToElement(latLongOut, "destbox");
            };
            
            var coloredIcon = {
                url: newUrl,
//                fillOpacity: .5,
//                anchor: new google.maps.Point(25,50),
//                scaledSize: new google.maps.Size(35,35)                
            };            
            
            var clickMarker = new google.maps.Marker({
                position: event.latLng,
                icon: coloredIcon,
                map: map,
                animation: google.maps.Animation.BOUNCE,              
                draggable: true,
                title: navStatus
            });    
            
            // removes marker created for lat long
            google.maps.event.addListener(map, "click", function (event) {
                clickMarker.setMap(null)             
            }); //end addListener    
        });
    };

    /*
    Takes the latlong object and writes numbers into the form's id. Enter as "myid"...etc
    */
    function writeLatLongToElement(latlong, formId) {
        console.log("writeLatLongToElement lat long: ", latlong);
        $("input[id="+formId+"]").val(String(latlong));
    };
    
    /* 
    Loads data using AJAX, with parameters of:
    @param map: api's map object
    @param dataUrl: the URL or local locations of geojson data
    @param category: a string description of each layer
    @param showOption: with the layer should be on ("layerOn") or off ("layerOff") initially on mapload
    */
    function getAjaxData(map, dataUrl, category, showOption, markerList) {
        // load the data
        $.ajax({
            url: dataUrl,  
            success: function(data) {
                parsePoints(data, category, markerList);
            },
            error: function(xhr, status, error) {
              alert("An AJAX error occured: " + status + "\nError: " + error);
            }            
        })
    };    
    
    
    /* Function to take geojson data to parse out geometries to create lat long coordinates 
    With parameters of:
    @param data: the json response object returned from the URL
    @param category: string of type of data or layers from different geojson files
    */
    function parsePoints(data, category, markerList) {
        for (var i = 0; i < data.features.length; i++) {
            var name, html, pointLatLong;
            var itemProps = data.features[i].properties;

            if (category == "tweets") {
                name = itemProps.name;
                html = "<b>"+itemProps.name+"<\/b><br \/>"+itemProps.text+"<br/>title='"+ itemProps.screen_nam;
                pointLatLong = new google.maps.LatLng(itemProps.latitude, itemProps.longitude);
                // create the marker
                // category could be a different type of twitter item
         

            } else if (category = "attractions") {
                name = itemProps.name;
                html = "<b>"+itemProps.name+"<\/b><br \/>"+itemProps.desc_+"<br/>title='"+ itemProps.name;
                var geom = data.features[i].geometry.coordinates;
                // the lat long were reversed. In google maps, it should be long, lat
                pointLatLong = new google.maps.LatLng(geom[1], geom[0]);
                // create the marker
                // category could be a different type of twitter item
            };
            
            var marker = createMarker(pointLatLong, name, html, category) //,category);
            // category could be used if we want to categorize the types of tweets
    //                var category = item.cat;
//            console.log(gmarkersTweets); // the markers are populated here
            
//            if (i = data.features.length-1) {
//                var populatedMarkerList = markerList;
//            }
        };
        //addToggleButtons(category, populatedMarkerList);
    };
    
    /* Function to create a google marker and set up event window
    from https://gist.github.com/phirework/4771983
    With parameters yof:
    @param latlng: the google map's api google.maps.LatLng() object based on LatLong coordinates in geojson data
    @param name: the geojson's properties attribute, name attribute
    @param html: the html code to be displayed in a popup
    @param category: string of type of data or layers from different geojson files
    */
    function createMarker(latlng, name, html, category) {
        // block to make different marker symbols for the "dataType" parameter.
        if (category == "tweets") {
            var myIcon = {
                url:  'img/tweets.svg',
//                anchor: new google.maps.Point(25,50),
                scaledSize: new google.maps.Size(40,40),
                fillOpacity: .6,
                strokeWeight: 1,
            }
            var backgroundColor = "rgba(64,153,255,0.6)";
            
        } else if (category == "attractions") {
            // Use this to create custom svg icons
//            var myIcon = {
//                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
//                scale: 3
//        }
            var myIcon = {
                url: 'img/attractions.svg',
                fillOpacity: .5,
                anchor: new google.maps.Point(25,50),
                scaledSize: new google.maps.Size(35,35)                
            };
//            var myIcon = 'img/attractions.svg';
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
            boxStyle: {width: "250px"},
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
        // no purpose for bouncing!
        marker.setAnimation(google.maps.Animation.DROP)
        // Store category and name info as a marker properties 
        marker.mycategory = category;   
        marker.html = html
        marker.myname = name;
        gmarkersTweets.push(marker);
//        console.log("gmarkersTweets: ", gmarkersTweets);

        google.maps.event.addListener(marker, 'click', function() {
            infoBox.setOptions(myOptions)
            infoBox.open(map, this);
        });        
    }; // end createMarker    
            
    
    $(document).ready(initMap);
    
})();