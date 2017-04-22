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
        
        google.maps.event.addListener(map, 'click', function() {
            infoBox.close();
        });        
        
        // Create accordian panels
        $( function() {
            $("#accordionpanel").accordion();
        });        
        
        var tweets = getAjaxData(map, "data/geotweets_merc3857.geo.json", "tweets", "layerOff", gmarkersTweets);
        var attractions = getAjaxData(map, "data/attractions_4326.geo.json", "attractions", "layerOn", gmarkersAttractions);
        
        // add google traffic layer
        var trafficLayer = new google.maps.TrafficLayer();
        trafficLayer.setMap(map);        
     };
    
    /* Loads data using AJAX, with parameters of:
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
    
    //START HERE LOOKING AT ANOTHER WAY TO REMOVE LAYERS FROM MAP
    // http://stackoverflow.com/questions/24411171/remove-all-features-from-data-layer  
    // Assigns a callback to remove features from google map using forEach loop with the callback function
    function removeLayer(map, features) {
        var callback = function(features) {
            map.data.remove(features);
        };
        map.data.forEach(callback);
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
            
            if (i = data.features.length-1) {
                var populatedMarkerList = markerList;
            }
        };
        addToggleButtons(category, populatedMarkerList);
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
            
    
    // NOT WORKING...
    function addToggleButtons(category, markerList) {
        // event listeners for layer buttons
        console.log("markerList in addToggleButtons", markerList);
        $("#"+category+"box").click(boxclick($(this), category, markerList));
        $("#"+category+"box").click(function() {
            $(this).prop("checked", false);
            console.log($(this));
        });        
        $("#tweetsbox").click(function() {
            // DOESN'T WORK for this.
            $(this).prop("checked", false);
            console.log($(this));
//            alert( "Handler for .click() called." );    
        });   
        
        // show or hide the categories in map initially
        if (category = "tweets")  {
            toggleLayer(category, markerList, true);
        } else if (category == "attractions") {
            toggleLayer(category, markerList, false);
        }
        
    };    
    
    /* Show data if box clicked, else remove from map
    With parameters of:    
    @param box: the html element of the checkbox on which the user clicks
    @param category: string of type of data or layers from different geojson files    
    */
    function boxclick(htmlBox, category, markerList) {
        console.log("box clicked");
//        console.log(htmlBox);
        if (htmlBox.checked) {
            toggleLayer(category, markerList, true);
        } else {
            toggleLayer(category, markerList, false);
        }
    };
    
    /* Shows all markers of a particular category, and ensures the checkbox is checked 
    With parameters of:    
    @param category: string of type of data or layers from different geojson files 
    @param markerList: the list of all google markers for given category
    @param toggleOption: true or false (no quotes) for toggling layer on/off
    */
    function toggleLayer(category, markerList, toggleOption) {
        console.log("markerList in toggleLayer: ", markerList);
        
        for (var i=0; i<markerList.length; i++) {
            console.log(markerList[i]);
            if (markerList[i].mycategory == category) {
                markerList[i].setVisible(toggleOption);
            }
        };
        // sets checkbox to false or true
        $("#"+category+"box").checked = toggleOption;
        // close the info window, in case its open on a marker that we just hid
        if (toggleOption == false) {
            infoBox.close();
        }            
    };

  
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