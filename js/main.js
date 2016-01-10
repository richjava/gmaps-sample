//'use strict';
//app class/namespace
var APP = APP || {};
//game class
APP.PlaceFinder = function PlaceFinder() {
    var self, map, mapCanvas, mainPosition, onNaviMode, naviDestination, currentInfowindow, iterator,
            locationJSON, markers, routeMarkers, directionsService, directionsDisplay,
            stepDisplay, numOfSaved;

    var NUM_OF_SAVED = 'numOfSaved';
    var SAVED_LOCATION = 'savedLocation';

    // make this object accessable within callbacks
    self = this;
    // set listener that initiates map when ready
    google.maps.event.addDomListener(window, 'load', function() {
        self.init();
    });

    /**
     * Initialise the app.
     */
    this.init = function() {
        //assign default values
        self = this;
        routeMarkers = [];
        locationJSON = {};
        var test = numOfSaved = localStorage.getItem("numOfSaved");
        //if nothing in local storage set numOfSaved to 0
        numOfSaved = localStorage.getItem("numOfSaved") === null ? '0' : localStorage.getItem("numOfSaved");
        iterator = 0;
        onNaviMode = false;
        naviDestination = null;

        currentInfowindow = new google.maps.InfoWindow();
        directionsService = new google.maps.DirectionsService();
        stepDisplay = new google.maps.InfoWindow();

        //MAP

        mapCanvas = document.getElementById("mapCanvas")
        //    There are two required options for every map: center and zoom. Center is 
        //    not required because we're going to pan to position.
        var mapOptions = {
            zoom: 12
        };
        //create map inside given HTML container
        //@see https://developers.google.com/maps/documentation/javascript/reference?hl=en
        map = new google.maps.Map(document.getElementById("mapCanvas"), mapOptions);
        //  center marker is located at Christchurch City Council
        mainPosition = new google.maps.LatLng(-43.531918, 172.631438);
        var marker = new google.maps.Marker({
            map: map,
            position: mainPosition,
            title: "Christchurch City Council"
        });
        //  Changes the center of the map to the given LatLng.
        map.panTo(mainPosition);
        markers = [];
        markers.push(marker);

        //DIRECTIONS DISPLAY

        var rendererOptions = {
            map: map
        };
        directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);
        directionsDisplay.setMap(map);
        //create directions display inside given HTML container
        directionsDisplay.setPanel(document.getElementById('directionsPanel'));
    }


    /**
     * Set the defulat location. Used on click of Home button.
     */
    this.setDefaultLocation = function() {
        //  Christchurch City Council
        mainPosition = new google.maps.LatLng(-43.531918, 172.631438);
        map.setCenter(mainPosition);
        markers[0].position = mainPosition;
        markers[0].title = "Christchurch City Council";
        if (onNaviMode) {
            calcRoute();
        } else {
            markers[0].setMap(map);
        }
    }

    /**
     * HTML5 Geolocation.
     */
    this.shareCurrentLocation = function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(this.showCurrentLocation, this.showGeolocationError);
        } else {
            mapCanvas.innerHTML = "Geolocation is not supported by this browser.";
        }
    }

    /**
     * Set current Geolocation position to map.
     * @param {Geoposition} position
     */
    this.showCurrentLocation = function(position) {
        mainPosition = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        map.setCenter(mainPosition);
        markers[0].position = mainPosition;
        markers[0].title = "Your current position";
        if (onNaviMode) {
            calcRoute();
        } else {
            markers[0].setMap(map);
        }
    }

    /**
     * Handle HTML5 Geolocation error.
     * @param {type} error
     */
    this.showGeolocationError = function(error) {
        switch (error.code) {
            case error.PERMISSION_DENIED:
                mapCanvas.innerHTML = "User denied the request for Geolocation.";
                break;
            case error.POSITION_UNAVAILABLE:
                mapCanvas.innerHTML = "Location information is unavailable.";
                break;
            case error.TIMEOUT:
                mapCanvas.innerHTML = "The request to get user location timed out.";
                break;
            case error.UNKNOWN_ERROR:
                mapCanvas.innerHTML = "An unknown error occurred.";
                break;
        }
    }

    /**
     * Get the location json and drop markers for each json location object.
     * Called on click of each location menu item, i.e. "Restaurants", etc.
     * @param {String} id
     */
    this.dropRegularMarkers = function(id) {
        locationJSON = {};
        $.getJSON("json/" + id + ".json", function(json) {
            locationJSON = json;
            self.dropMarkers(locationJSON.locations, false);
        });
    }

    /**
     * Drop markers for each json location object. Called on click of the "Favorites" menu item.
     */
    this.dropFavoriteMarkers = function() {
        if (numOfSaved === '0') {
            alert("No saved location exists!");
        } else {
            var favorites = this.getFavorites();
            locationJSON = {"locations": favorites};
            this.dropMarkers(favorites, true);
        }
    }

    /*
     * Drop markers for each item in array.
     * @param {Array} arr
     * @param {Boolean} isFavorite
     * @returns {undefined}     */
    this.dropMarkers = function(arr, isFavorite) {
        //clean up first
        self.clearRoute();
        self.clearCustomMarkers();
        for (var i = 0; i < arr.length; i++) {
            setTimeout(function() {
                self.dropCustomMarkers(isFavorite);
            }, i * 200);
        }

    }

    /**
     * Get favourite locations.
     * @returns {Array|getFavorite.objArr}
     */
    this.getFavorites = function() {
        var retrievedObject = [];
        var objArr = [];
        numOfSaved = parseInt(numOfSaved);
        for (var i = 0; i < numOfSaved; i++) {
            retrievedObject[i] = localStorage.getItem(SAVED_LOCATION + (i + 1).toString());
            var obj = JSON.parse(retrievedObject[i]);
            objArr.push(obj);
        }
        return objArr;
    }

    /**
     * 
     * @param {int} index
     */
    this.saveFavorite = function(index) {
        if (confirm("Save to Local Storage?")) {
//        if (numOfSaved == null) {
//            numOfSaved = "0";
//        }
            numOfSaved = parseInt(numOfSaved) + 1;
            //local storage stores values as strings
            var str = numOfSaved.toString();
            localStorage.setItem(NUM_OF_SAVED, str);
            localStorage.setItem(SAVED_LOCATION + str, JSON.stringify(locationJSON.locations[index]));
            alert("Location saved!");
        }
    }

    this.clearFavorites = function() {
        if (numOfSaved == "0") {
            alert("No saved location exists!");
        } else {
            if (confirm("Delete all saved favorite spots?")) {
                localStorage.removeItem(NUM_OF_SAVED);
                for (var i = 0; i < numOfSaved; i++) {
                    localStorage.removeItem(SAVED_LOCATION + (i + 1).toString());
                }
                numOfSaved = null;
                this.clearRoute();
                this.clearCustomMarkers();
            }
            numOfSaved = '0';
        }
    }
    this.getFavoriteButtonHtml = function() {
        return "<a href='#' onclick='placeFinder.saveFavorite(" + iterator + ")'>Save</a>";
    }


    this.dropCustomMarkers = function(isFavorite) {
        var location = locationJSON.locations[iterator];
        var locationInfoHtml = location.html;
        //get the html for the InfoWindow from the JSON object
        if (!isFavorite) {
            locationInfoHtml += this.getFavoriteButtonHtml();
        }
        var image = {
            url: locationJSON.locations[iterator].image.url,
            size: new google.maps.Size(location.image.size[0], location.image.size[1]),
            origin: new google.maps.Point(location.image.origin[0], location.image.origin[1]),
            anchor: new google.maps.Point(location.image.anchor[0], location.image.anchor[1])
        };
        var marker = new google.maps.Marker({
            title: location.title,
            position: new google.maps.LatLng(location.latitude, location.longitude),
            map: map,
            icon: image,
            shape: location.shape,
            zIndex: location.zIndex,
            draggable: false,
            animation: google.maps.Animation.DROP
        });
        var infoWindow = new google.maps.InfoWindow({
            content: locationInfoHtml,
            maxWidth: 200
        });

        google.maps.event.addListener(marker, 'click', function() {
            currentInfowindow.close();
            infoWindow.open(map, marker);
            currentInfowindow = infoWindow;
            naviDestination = marker.getPosition();
            onNaviMode = true;
            self.calcRoute();
        });
        google.maps.event.addListener(infoWindow, 'closeclick', function() {
            onNaviMode = false;
            self.clearRoute();
        });

        markers.push(marker);
        iterator++;
    }


    this.clearCustomMarkers = function() {
        iterator = 0;
        for (var i = 1; i < markers.length; i++) {
            markers[i].setMap(null);
        }
        markers.splice(1, markers.length - 1);
    }

    /**
     * Clear any existing routes.
     */
    this.clearRoute = function() {
        for (var i = 0; i < routeMarkers.length; i++) {
            routeMarkers[i].setMap(null);
        }
        routeMarkers = [];
        directionsDisplay.setDirections({routes: []});
        markers[0].setMap(map);
    }

    /**
     * Clear any existing routes and calculate the new route using the 
     * DirectionsService route() method.
     */
    this.calcRoute = function() {
        this.clearRoute();
        var request = {
            origin: mainPosition,
            //naviDestination will be the position of the marker that was clicked
            destination: naviDestination,
            travelMode: google.maps.TravelMode.DRIVING
        };
        // Route the directions and pass the response to a
        // function to create markers for each step.
        directionsService.route(request, function(response, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                directionsDisplay.setDirections(response);
                self.showSteps(response);
            }
        });
        markers[0].setMap(null);
    }

    /*
     * Handle the response directions for the DirectionsService route() method callback.
     * @param {google.maps.DirectionResult} directionResult
     */
    this.showSteps = function(directionResult) {
//     For each step, place a marker, and add the text to the marker's info window. 
//     Also attach the marker to an array so we can keep track of it and remove it when calculating new routes.
        var myRoute = directionResult.routes[0].legs[0];

        for (var i = 0; i < myRoute.steps.length; i++) {
            var marker = new google.maps.Marker({
                position: myRoute.steps[i].start_location,
                map: map
            });

            this.attachInstructionText(marker, myRoute.steps[i].instructions);
            routeMarkers[i] = marker;
        }
    }

    /**
     * Add an on click listener to the marker to show the instructions for the step.
     * @param {google.maps.Marker} marker
     * @param {String} text
     * 
     */
    this.attachInstructionText = function(marker, text) {
        google.maps.event.addListener(marker, 'click', function() {
//         Open an info window when the marker is clicked on,containing the text of the step.
            stepDisplay.setContent(text);
            stepDisplay.open(map, marker);
        });
    }
};
//$(function() {
var placeFinder = new APP.PlaceFinder();
//});