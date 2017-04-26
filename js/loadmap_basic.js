"use strict";
(function() {     
    var map;
    var gmarkersTweets = [];
    var gmarkersAttractions = [];
    var infoBox = new InfoBox();
    
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
        
        var tweets = getAjaxData(map, "data/geotweets_merc3857.geo.json", "tweets", gmarkersTweets);
        var attractions = getAjaxData(map, "data/attractions_4326.geo.json", "attractions", gmarkersAttractions);
        
        // add google traffic layer
        var trafficLayer = new google.maps.TrafficLayer();
        trafficLayer.setMap(map);            
     };
    
    /* Attaches a click event to the map and creates a basic marker onclick, and then when user clicks again the marker is removed.
    @param map: google maps google.maps.Map object.
    @param navStatus: "start" or "end" for whether the marker object created is the starting or ending position of the track. 
    */
    function makeNavMarkerWithClick(map, navStatus) {    
        var latLongOut = [];
        google.maps.event.addListener(map, 'click', function(event) {    
            var latitude = event.latLng.lat();
            var longitude = event.latLng.lng();            
            latLongOut = [latitude, longitude];
            // Place a draggable marker on the map
            // set colors for start/end
            if (navStatus == "start") {
                var newUrl = 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'               
            } else if (navStatus == "end") {
                // populate global variable for lat longs
                var newUrl = 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
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
                draggable: false,   // changed to false since the latlong coords don't update yet through
                                    // the form element
                title: navStatus
            });             
            
            // removes marker created for lat long
            google.maps.event.addListener(map, "click", function (event) {
                clickMarker.setMap(null)             
            }); //end addListener    
            
            // removes marker created for lat long
            google.maps.event.addListener(map, "click", function (event) {  
                // populate global variable for lat longs    
                writeLatLongToSelectedForm(latLongOut, navStatus+"box");                
            }); //end addListener    
            
        });
    };     
    
    
    /*
    PseudoCode:
    1. User clicks anywhere on the map, including an attraction or tweet, and gets an InfoBox.  InfoBox ALWAYS has a 'Ride to Here' and 'Ride from Here' button.
    --function createNavMarker: creates a marker when user clicks anywhere on map except on existing points/layers to add "Ride to Here" and "Ride from Here" links in popup.
    --function addNavLinksToPopup: extend existing createMaker function to add option to "Ride to Here" and "Ride from Here" links in popup.
    
    2. onClick, lat/lng coordinates are sent from that location to the origin/destination textbox (depending on what they choose).  User is prompted to select the missing origin/destination (when one is defined, highlight the other; if user submits query without destination or origin, stop them and prompt them to provide it...)
    --function clickNavLink() onclick event handler for popup box on any popup to take coords from of marker and write those to a global variable and populate the form fields.
    --function checkFormFields() to check form fields if they have a value, if not, then highlight and inform user to select a location on the map or type an address in.
    
    3.  Potentially write a little function to swap origin/destination'
    --function swapNavPoints() When user enters either a start or end point, then a link appears near other buttons to allow user to swap the start/end points. When button is clicked, then store start field .val in variable, store in end field .val in variable and then write them into opposite fields. 
    */
    

    //////////
    // function to get user's device location. see https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition
    //////////
    
    //////////
    // function get allow user to drag their marker and get the new location
    // http://stackoverflow.com/questions/5290336/getting-lat-lng-from-google-marker
    ///////////
    
    
    /* Loads data using AJAX.
    @param map: api's map object
    @param dataUrl: the URL or local locations of geojson data
    @param category: a string description of each layer
    @param showOption: with the layer should be on ("layerOn") or off ("layerOff") initially on mapload 
    */
    function getAjaxData(map, dataUrl, category, markerList) {
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
    
    
    /* Takes geojson data to parse out geometries to create lat long coordinates 
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
//                console.log("itemProps: ",itemProps);
                html = "<b>"+itemProps.name+"<\/b><br/>"+itemProps.desc+"<br/>title='"+ itemProps.name;
                var geom = data.features[i].geometry.coordinates;
                // the lat long were reversed. In google maps, it should be long, lat
                pointLatLong = new google.maps.LatLng(geom[1], geom[0]);
                // create the marker
                // category could be a different type of twitter item
            };
            
            var marker = createMarker(pointLatLong, name, html, category) //,category);
        };
    };
    
    /* Creates a google marker and set up event window
    from https://gist.github.com/phirework/4771983
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
            var backgroundColor = "rgba(120,120,120, 0.6)";
        }        

        var marker = new google.maps.Marker({
            position: latlng,
            //        icon: category + ".png",
            icon: myIcon,
            map: map,
            title: name,
            zIndex: Math.round(latlng.lat()*-100000)<<5
        });
        
        marker.setAnimation(google.maps.Animation.DROP)
        // Store category and name info as a marker properties 
        marker.mycategory = category;   
        marker.myname = name;
        gmarkersTweets.push(marker);
        google.maps.event.addListener(marker, 'click', function() {
            var myOptions = setPopupOptions(marker.position, name, html, backgroundColor); 
            console.log("marker.position: ", marker.position);
            infoBox.setOptions(myOptions);
            infoBox.open(map, this); 
        });        
        
//        google.maps.event.trigger(marker, 'click'); // opens the info window onload 
    }; // end createMarker    
            
    /* Returns popup properties {} options for a popup and attaches start & end navigation buttons.
    @ params name: name property of the geojson file when parsed
    @ params html: html content to be attached to the Div's innerHTML
    */
    function setPopupOptions(latlong, name, html, backgroundColor) {
        var infoBoxDiv = document.createElement("div");
        infoBoxDiv.style.cssText = "margin-top: 30px; background: " + backgroundColor + "; padding: 10px; border-radius: 5px; color: #fff";
        var fullContent = name 
        infoBoxDiv.innerHTML = html;

        // add in html elements for nav start/end buttons to send lat/longs to forms
        infoBoxDiv.innerHTML += addNavButtons(latlong);
        console.log("latlong: ", latlong.lng, latlong.lat);
//        var startButton, endButton;    
//        var startButton = infoBoxDiv.appendChild(document.createElement('input'));
//        startButton.type='button';
//        startButton.setAttribute("id", "#startbutton");
//        startButton.value='Ride from Here!'
//        google.maps.event.addDomListener(startButton,'click', function(){
//            sendLocationToStart(latlong);})         

        var popupOptions = {
            content: infoBoxDiv,
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

        return popupOptions;
    };    

    $(document).ready(initMap);
    
//THESE WERE ADDED AS GLOBAL FUNCTIONS IN INDEX.HTML    
//    /* When user clicks the end button, a click on the map fills in the form field with the lat long object and writes numbers into the startbutton and startfield.
//    @param latlong: an array of the [latitude, longitude] or any numbers to populate the form's field.
//    @param navOption: "start" or "end" of the form field id ("endbox" or "startbox" or button id of "startbutton" or "endbutton". 
//    */
//    function sendLocationToStart(latlong) {
//        $("#startbutton").click(function(){
//            alert("Click a place on the map for a starting point.")
////            makeNavMarkerWithClick(map, "end");
//            $("input[id=startfield]").val(String(latlong));
//        });
//    };       
//    
//    /* When user clicks the end button, a click on the map fills in the form field with the lat long object and writes numbers into the endbutton and endfield.
//    @param latlong: an array of the [latitude, longitude] or any numbers to populate the form's field.
//    @param navOption: "start" or "end" of the form field id ("endbox" or "startbox" or button id of "startbutton" or "endbutton". 
//    */
//    function sendLocationToEnd(latlong) {
//        $("#endbutton").click(function(){
//            alert("Click a place on the map for a starting point.")
////            makeNavMarkerWithClick(map, "end");
//            $("input[id=endfield]").val(String(latlong));
//        });
//    };    
    

    /* Adds end and start nav buttons with click events to the buttons. To be added to innerHTML of info windows.
    @params: latlong: the returned list of [latitude, longitude]
    */
    function addNavButtons(latlong) {
        console.log("latlong: ", latlong);
        // Added for nav buttons
        var endButton = "<p><button type='button' id='endbutton' onclick='sendLocationToEnd("+latlong+")'>Ride to Here</button></p>";        
        var startButton = "<p><button type='button' id='startbutton' onclick='sendLocationToStart("+latlong+")'>Ride from Here</button></p>";
        var addNavButtons = endButton + startButton;
        return addNavButtons;  
    };    
    
})();