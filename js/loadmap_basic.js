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
        
        // set event listeners for clicking on the start and end buttons for navigation
        clickStartButton();
        clickEndButton();
     };
    
    /*
    When user clicks the start button, a click on the map fills in the form field with the lat long
    */
    function clickStartButton() {
        $("#startbutton").click(function(){
            //alert("Click a place on the map for a starting point.")
            makeNavMarkerWithClick(map, "Start");
        })
    };
    
    /*
    When user clicks the end button, a click on the map fills in the form field with the lat long
    */
    function clickEndButton() {
        $("#endbutton").click(function(){
            //alert("Click a place on the map for a ending point.")
            makeNavMarkerWithClick(map, "End");
        })
    };        
    
    /*
    Attaches a click event to the map and creates a basic marker onclick, and then when user clicks again the marker is removed.
    @param map: google maps google.maps.Map object.
    @param navStatus: "start" or "end" for whether the marker object created is the starting or ending position of the track.
    */
    function makeNavMarkerWithClick(map, navStatus) {
        // holds function variable
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
            google.maps.event.addListener(map, "dblclick", function (event) {  
                // populate global variable for lat longs    
                writeLatLongToSelectedForm(latLongOut, navStatus+"box");                
            }); //end addListener    
            
        });
    };    
    
    /*
    Takes the latlong object and writes numbers into the form's id of that in focus. Enter as "myid"...etc
    @param latlong: an array of the [latitude, longitude] or any numbers to populate the form's field with the form id="formId"
    @param formId: id of field for form to be populated with latlong numbers
    */
    function writeLatLongToSelectedForm(latlong, formId) {
        $("input[id="+formId+"]").val(String(latlong));
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
    
    /* Creates a google marker for navigation points and set up event window
    from https://gist.github.com/phirework/4771983
    With parameters of:
    @param latlng: the google map's api google.maps.LatLng() object based on LatLong coordinates in geojson data
    @param name: the geojson's properties attribute, name attribute
    @param html: the html code to be displayed in a popup
    @param category: string of type of data or layers from different geojson files
    */
    function createNavMarker(latlng, name, html, category) {
        var myIcon = {
            newUrl:  'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
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
    
    //////////
    // function to get user's device location. see https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition
    //////////
    
    
    /* 
    Loads data using AJAX, with parameters of:
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
        };
    };
    
    /* Creates a google marker and set up event window
    from https://gist.github.com/phirework/4771983
    With parameters yof:
    @param latlng: the google map's api google.maps.LatLng() object based on LatLong coordinates in geojson data
    @param name: the geojson's properties attribute, name attribute
    @param html: the html code to be displayed in a popup
    @param category: string of type of data or layers from different geojson files
    */
    function createMarker(latlng, name, html, category) {
        // Added for nav buttons
        var endButton = "<p><button type='button' id='endbutton'>Ride to Here</button></p>";        
        var startButton = "<p><button type='button' id='startbutton'>Ride from Here</button></p>";
        var addNavButtons = endButton + startButton;
        html += addNavButtons;
        //////////////        
        
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
        marker.myname = name;
        gmarkersTweets.push(marker);
        google.maps.event.addListener(marker, 'click', function() {
            infoBox.setOptions(myOptions);
            infoBox.open(map, this);
        });        
    }; // end createMarker    
            
    // Adds start & end urls to popup 
    function addNavLinksToPopup(marker, html) {
        var navUrls = "<p><button class='.btn-link' type='button' id='navlink'>Ride from Here</button></p>";       
        return html += navUrls;
    };
        
    
    $(document).ready(initMap);
    
})();