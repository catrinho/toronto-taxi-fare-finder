jQuery(document).ready(TaxiFareFinder);


/**
 * This class is the driver class of a taxi fare estimator. It creates:
 * 1) Input fields where the user enters their taxi route origin and 
 *    destination.
 * 2) A button the user clicks to show their estimated taxi fare. 
 * 3) A map (via Google Maps API) that shows the taxi route from origin to
 *    destination.
 * 4) An output field that shows the estimated taxi fare and route distance (or 
 *    an error message if a valid route origin or destination has not been
 *    provided).
 * 5) A fare calculator that computes an estimate of the taxi route fare based
 *    on the route distance.
 *
 * This class makes use of the jQuery library and Google Maps API. 
 */
function TaxiFareFinder() {
    
    // Origin input field.
    var originInput;
    
    // Destination input field.
    var destinationInput;

    // Button shown to user.
    var showFareButton;
    
    // Map of route.
    var mapOutput;
    
    // Fare output field.
    var fareOutput;
    
    // Estimates the taxi fare for travelling a certain route.
    var fareCalculator;
   
    // Initialize the input/output fields with the loaded configurable values.
    jQuery.ajax({
        type: 'GET',
        url: 'xml/strings.xml',
        dataType: 'xml',
        success: initialize
    });

    
    /**
     * Initializes the taxi route origin and destination input fields, the "show
     * fare" button, the map and message output fields, and the fare calculator 
     * object.
     *
     * @param xml XML received via AJAX GET request.
     */     
    function initialize(xml) {        
        originInput = new InputField(
            jQuery('#origin-input'), 
            jQuery(xml).find('#origin_input_placeholder').text()
        );

        destinationInput = new InputField(
            jQuery('#destination-input'), 
            jQuery(xml).find('#destination_input_placeholder').text()
        );       
              
        showFareButton = jQuery('#show-fare-button').text(jQuery(xml)
                .find('#show_fare_button_value').text());
        
        fareOutput = new OutputField(
            jQuery('#fare-output'),
            {
                hidden: 'js-hidden',
                error: 'error',
                totalFare: 'total-fare'
            }
        );
        
        mapOutput = new MapDisplay(
            jQuery('#map-output'),
            originInput,
            destinationInput,
            showFareButton,
            fareOutput,
            new google.maps.LatLng(
                parseFloat(jQuery(xml).find('#map_output_center_lat').text()), 
                parseFloat(jQuery(xml).find('#map_output_center_lng').text())
            ),
            {
                defaultZoomLevel: parseInt(jQuery(xml)
                        .find('#map_output_default_zoom_level').text()),                 
                
                mapStyleName: jQuery(xml)
                        .find('#map_output_map_style_name').text(), 

                markerImageUrlPrefix: jQuery(xml)
                        .find('#map_output_marker_image_url_prefix').text(), 
                markerShadowUrl: jQuery(xml)
                        .find('#map_output_marker_shadow_url').text(), 
                
                originMarkerColour: jQuery(xml)
                        .find('#map_output_origin_marker_colour').text(),
                originMarkerIcon: jQuery(xml)
                        .find('#map_output_origin_marker_icon').text(),
                originMarkerTitle: jQuery(xml)
                        .find('#map_output_origin_marker_title').text(),               
                                
                destinationMarkerColour: jQuery(xml)
                        .find('#map_output_destination_marker_colour').text(),
                destinationMarkerIcon: jQuery(xml)
                        .find('#map_output_destination_marker_icon').text(),                 
                destinationMarkerTitle: jQuery(xml)
                        .find('#map_output_destination_marker_title').text(),
                
                routeStrokeColour: jQuery(xml)
                        .find('#map_output_route_stroke_colour').text(),
                routeStrokeWeight: jQuery(xml)
                        .find('#map_output_route_stroke_weight').text()
            },
            jQuery(xml).find('#invalid_input_error_message').text(),
            'error'            
        );
                
        fareCalculator = new FareCalculator(
            originInput,
            destinationInput,
            showFareButton,
            fareOutput,
            {
                baseRate: new Decimal(parseFloat(jQuery(xml)
                        .find('#fare_base_rate').text()), 2),
                distanceUnit: new Decimal(parseFloat(jQuery(xml)
                        .find('#fare_distance_unit').text()), 3),
                ratePerDistanceUnit: new Decimal(parseFloat(jQuery(xml)
                        .find('#fare_rate_per_distance_unit').text()), 2)
            }
        );
    }  
}


/**
 * This class represents an input field. This field displays placeholder text 
 * when empty.
 *
 * This class makes use of the jQuery library. 
 *
 * @param {jQuery} element The input field element.
 * @param {String} placeholder This input field's placeholder text.
 */
function InputField(element, placeholder) {

    // This input field's last recorded value.
    var oldValue = new String();

    showPlaceholder();
    
    element.focus(updateOnFocus).blur(updateOnBlur); 
   
      
    /**
     * Returns the input field element.
     * 
     * @return {jQuery} The input field element.
     */   
    this.getElement = function() {
        return element;
    }


    /**
     * Returns this input field's placeholder text.
     * 
     * @return {String} This input field's placeholder text.
     */     
    this.getPlaceholder = function() {
        return placeholder;
    }

    
    /**
     * Returns this input field's last recorded value.
     * 
     * @return {String} This input field's last recorded value.
     */     
    this.getOldValue = function() {
        return oldValue;
    }
    
    
    /**
     * Sets this input field's last recorded value to a new value.
     * 
     * @param {String} newValue The new value to set this field's last recorded
     *         value to.
     */             
    this.setOldValue = function(newValue) {
        oldValue = newValue;
    }
    
    
    /**
     * Shows this input field's placeholder text.
     */
    function showPlaceholder() {
        element.val(placeholder).addClass('placeholder');
    }


    /**
     * Hides this input field's placeholder text.
     */    
    function hidePlaceholder() {
        element.val('').removeClass('placeholder');
    } 
    
    
    /**
     * Checks if the field's placeholder text is showing, and hides it if it 
     * is.
     */           
    function updateOnFocus() {
        if(element.val() == placeholder && element.hasClass('placeholder')) {
            hidePlaceholder();
        } 
    }


    /**
     * Checks if this input field's value is empty, and shows its placeholder 
     * text if it is.
     */    
    function updateOnBlur() {
        if(element.val() == '') {
            showPlaceholder();
            oldValue = '';            
        } 
    }   
}


/**
 * This class shows a map that displays the taxi route from the given origin to
 * the given destination. If either the origin or the destination is invalid,
 * it calls for an additional error message to be displayed.
 *
 * This class makes use of the jQuery library and Google Maps API.
 *
 * @param {jQuery} element The output element that displays the taxi route map.
 * @param {InputField} originInput The input field where the taxi route origin 
 *         is entered.
 * @param {InputField} destinationInput The input field where the taxi route 
 *         destination is entered. 
 * @param {jQuery} showFareButton The button that, when clicked, displays the
 *         taxi route from the origin to the destination, along with the 
 *         estimated fare.
 * @param {jQuery} outputField The output field that shows the taxi fare 
 *         estimate (or an error message if either the given route origin or 
 *         destination is invalid).
 * @param {Array} mapProperties Associative array of map and map element 
 *         properties. Includes:
 *          1) defaultZoomLevel: Default zoom level to display map at.
 *          2) mapStyleName: Name of map style.
 *          3) markerImageUrlPrefix: URL prefix for dynamic marker image load.
 *          4) markerShadowUrl: URL for dynamic marker shadow load.
 *          5) originMarkerColour: Origin marker colour.
 *          6) originMarkerIcon: Origin marker icon in marker image.
 *          7) originMarkerTitle: Origin marker title shown on hover.
 *          8) destinationMarkerColour: Destination marker colour.
 *          9) destinationMarkerIcon: Destination marker icon in marker image.
 *         10) destinationMarkerTitle: Destination marker title shown on hover.
 *         11) routeStrokeColour: Taxi route stroke colour.
 *         12) routeStrokeWeight: Taxi route stroke weight.
 * 
 * @param {String} errorMessage The error message to show when the given route
 *         origin or destination is invalid. 
 * @param {String} errorClass The styling class applied to the output field when
 *         it shows an error message.
 */
function MapDisplay(
    element,     
    originInput, 
    destinationInput, 
    showFareButton,
    fareOutput,
    center,
    mapProperties,
    errorMessage,
    errorClass
) {      
    
    // Geocoder for coding addresses.
    var geocoder = new google.maps.Geocoder();

    // DirectionsService used to find directions between origin and destination.
    var directionsService = new google.maps.DirectionsService();
    
    // Array of (uncoded) addresses provided by user.
    var addresses = new Array();
    
    // Array of coded addresses ready to be shown on map.
    var codedAddresses = new Array();

    // Array of map style settings.
    var mapStyle = [
        {
            featureType: 'all',
            stylers: [
                {saturation: -100},
                {gamma: 1}
            ]
        }
    ]
   
    // "Greyscale" styled map type.
    var styledMapType = new google.maps.StyledMapType(
        mapStyle, 
        {name: mapProperties.mapStyleName}
    );
           
    // Show map at default location.
    showMap(
        {
            zoom: mapProperties.defaultZoomLevel,
            center: center,
            mapTypeControlOptions: {
                mapTypeIds: [
                    google.maps.MapTypeId.ROADMAP, 
                    mapProperties.mapStyleName
                ]
            }
        }
    ); 
    
    showFareButton.bind('click', updateContent);
    
     
    /**
     * Shows the map to the user. The map may include markers at the origin and
     * destination points specified by the user, as well as the taxi route line
     * between those points.
     *
     * @param {Array} mapOptions Associative array of settings for the shown map
     *         (e.g. the center coordinates of the map and zoom level).
     * @param {Array} Array of markers to be shown on the map.
     */
    function showMap(mapOptions, markers) {
        

        // Map that is shown to user.
        var map = new google.maps.Map(element.get(0), mapOptions);
        
        map.mapTypes.set(mapProperties.mapStyleName, styledMapType);
        map.setMapTypeId(mapProperties.mapStyleName);
        
        // Styling options for the taxi route line.
        var polylineOptions = new google.maps.Polyline({
            strokeColor: mapProperties.routeStrokeColour, 
            strokeWeight: mapProperties.routeStrokeWeight
        });
        
        // DirectionsRenderer to show taxi route line.
        var directionsDisplay = new google.maps.DirectionsRenderer({
            polylineOptions: polylineOptions,
            suppressMarkers: true,
            suppressInfoWindows: true
        });
        directionsDisplay.setMap(map);

        // Show markers (if any) on map.
        if(markers) {
            jQuery.each(markers, function(count, marker) {
                marker.setMap(map);
            });
        }
        
        // Request to get directions between origin and destination.
        var request = {
            origin: originInput.getElement().val(),
            destination: destinationInput.getElement().val(),
            travelMode: google.maps.DirectionsTravelMode.DRIVING       
        };
        
        // Show the taxi route line.
        directionsService.route(
            request, 
            function(response, status) {
                if (status == google.maps.DirectionsStatus.OK) {
                    directionsDisplay.setDirections(response);
                }
            }
        );
    }
    
    
    /**
     * Updates map content.
     */
    function updateContent() {
        addresses[0] = originInput.getElement().val();
        addresses[1] = destinationInput.getElement().val();
        
        codeAddresses(addresses, 0, codeAddresses);       
    }
    

    /**
     * Codes each address in given array (running recursively), then shows the 
     * coded addresses (and the taxi route line between them) on the map.
     * 
     * @param {Array} Array of addresses to be coded.
     * @param {Number} index The index value in the address array to check next
     *         for coding.
     * @param {Function} callback Callback function representing codeAddresses()
     *         itself - used to run recursively until all addresses have been
     *         coded.
     */
    function codeAddresses(addresses, index, callback) {
        
        // Code each address in given array...
        if (index < addresses.length) {
            geocoder.geocode(
                {'address': addresses[index]}, 
                function(results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        codedAddresses[index] = results[0].geometry.location;
                        
                        // Recursive call to codeAddresses().
                        callback(addresses, index + 1, codeAddresses);
                    } else {
                        fareOutput.showMessage(errorMessage, errorClass);
                    }
                });
        
        // ...then show the coded addresses on the map.        
        } else {
            var origin = codedAddresses[0];
            var destination = codedAddresses[1];
            
            showMap(
                {
                    zoom: mapProperties.defaultZoomLevel,                   
                    center: new google.maps.LatLng(
                        (origin.lat() + destination.lat()) / 2, 
                        (origin.lng() + destination.lng()) / 2
                    ),
                    
                    mapTypeControlOptions: {
                        mapTypeIds: [
                            google.maps.MapTypeId.ROADMAP, 
                            mapProperties.mapStyleName
                        ]
                    }
                },
                [
                    makeMarker(
                        origin, 
                        mapProperties.originMarkerTitle, 
                        mapProperties.originMarkerColour, 
                        mapProperties.originMarkerIcon
                    ),
                    
                    makeMarker(
                        destination, 
                        mapProperties.destinationMarkerTitle, 
                        mapProperties.destinationMarkerColour, 
                        mapProperties.destinationMarkerIcon
                    )
                ]
            );   
        }
    }
    
    
    /**
     * Makes markers to be placed on the map.
     *
     * @param {LatLng} position The marker position.
     * @param {String} title The marker title.
     * @return {Marker} The marker to be placed on the map.
     */
    function makeMarker(position, title, markerColor, markerIcon) {

        // Get marker image from Google Charts API, and set its size and points.
        var markerImage = new google.maps.MarkerImage(
            mapProperties.markerImageUrlPrefix + 
                    markerIcon + '|' + markerColor,
            new google.maps.Size(21, 34),
            new google.maps.Point(0,0),
            new google.maps.Point(10, 34)
        );
        
        // Get marker shadow from same source, and set its size and points.
        var markerShadow = new google.maps.MarkerImage(
            mapProperties.markerShadowUrl,
            new google.maps.Size(40, 37),
            new google.maps.Point(0, 0),
            new google.maps.Point(12, 35)
        );
        
        // Make the marker.
        var marker = new google.maps.Marker({
            position: position,
            title: title,
            icon: markerImage,
            shadow: markerShadow           
        });
    
        return marker;
    }    
}


/**
 * This class represens an output field. It creates and shows either a taxi
 * fare estimate message (including the taxi route distance) or an error
 * message (if the given taxi route origin or destination is invalid).
 *
 *  This class makes use of the jQuery library.
 *
 * @param {jQuery} element The output element that displays messages.
 * @param {Array} stylingClasses An associative array of styling classes that 
 *         can be applied to the message output element as well as its child
 *         elements (e.g. parts of the message). It includes:
 *         1) hidden: Class originally applied to output element to hide it from 
 *                    view and prevent it flickering into and out of view on 
 *                    page load.
 *         2) error: Class applied to output element when it shows an error 
 *                    message.
 *         3) totalFare: Class applied to the total fare amount shown within
 *                    the output element.
 */
function OutputField(element, stylingClasses) {
    
    // Hide element and remove class that first hid it (to avoid flickering). 
    element.hide();
    element.removeClass(stylingClasses.hidden);

    // Total fare.
    var totalFare;
    
    // Total taxi route distance.
    var totalDistance;
    
    // Message to display.
    var message;
    
    // Styling class to apply to the message output element. 
    var messageClass;
    
    
    /**
     * Shows the total taxi fare and total taxi route distance.
     * 
     * @param {String} newTotalFare Total taxi fare to display.
     * @param {String} newTotalDistance Total taxi route distance to display.
     */
    this.showFare = function(newTotalFare, newTotalDistance) {
        totalFare = newTotalFare;
        totalDistance = newTotalDistance;
        
        showOutputField(makeFareMessage);
    }


    /** 
     * Reveals the output field showing a message to the user.
     *
     * @param {String} newMessage The message to show the user.
     * @param {String} newMessageClass the class to add to the output field
     *         element.
     */
    this.showMessage = function(newMessage, newMessageClass){
        message = newMessage;
        messageClass = newMessageClass;
        
        showOutputField(makeMessage);
    }
    
    
    /**
     * Makes message to show the user by adding the message content and class to
     * the output element.
     */
    function makeMessage() {
        element.html(message);
        element.addClass(messageClass);
    }

    
    /**
     * Makes message that shows the total taxi fare estimate and total taxi
     * route distance.
     */
    function makeFareMessage() {
    
        // Document fragment to which all text/HTML is appended.
        var fragment = document.createDocumentFragment();
    
        // Display element containing the total taxi fare amount.
        var totalFareOutput = jQuery('<p>').text(totalFare)
                .addClass(stylingClasses.totalFare);
        
        // Display element containing the total taxi route distance.
        var totalDistanceOutput = jQuery('<p>').text(totalDistance);
        
        fragment.appendChild(totalFareOutput[0]);
        fragment.appendChild(totalDistanceOutput[0]);
        
        element.empty();
        element[0].appendChild(fragment);
        
        // Remove "error" message styling class if output element has it.
        if(element.hasClass(stylingClasses.error)) {
            element.removeClass(stylingClasses.error);
        }
    }
    
    /**
     * Reveals the output field to the user.
     *
     * @param {function} action The function to carry out upon fading out the
     *         output field so that it is completed by the time the output field
     *         fades in again (e.g. the given function could change the output
     *         field text while it is not yet visible to the user).
     */
    function showOutputField(action) {
        element.fadeOut(action);
        element.fadeIn();
    }    
}


/**
 * This class represents a taxi fare calculator. It receives the taxi route
 * origin and destination from two input fields when the "show fare" button is 
 * pressed. It calculates the total taxi route distance and outputs the fare 
 * estimate based on that distance.
 *
 * This class makes use of the jQuery library and Google Maps API.
 * 
 * @param {InputField} originInput The input field where the taxi route origin 
 *         is entered.
 * @param {InputField} destinationInput The input field where the taxi route 
 *         destination is entered. 
 * @param {jQuery} showFareButton The button that, when clicked, displays both 
 *         the the estimated taxi fare and the taxi route from the origin to the
 *         destination.
 * @param {jQuery} fareOutput The output field that shows the taxi fare 
 *         estimate.
 * @param {Number} fare An associative array of values used to calculate the 
 *         taxi fare. Includes:
 *         1) baseRate: The base fare for the first unit of distance traveled by
 *                    taxi.
 *         2) distanceUnit: The unit of distance (e.g. a certain number of 
 *                    meters) to which the rate per distance unit applies.
 *         3) RatePerDistanceUnit: The fare rate charged per distance unit
 *                    travelled by taxi.
 */
function FareCalculator(
    originInput,
    destinationInput,
    showFareButton,
    fareOutput,
    fare
) {    
    
    // DirectionsService used to find directions between origin and destination.
    var directionsService = new google.maps.DirectionsService();
    
    // Total taxi route distance.
    var totalDistance;
    
    // Total taxi route distance minus first distance unit (has different fare).
    var distanceOverBase;
    
    // Fare per unit of distance.
    var distanceFare;
    
    // Total fare.
    var totalFare;
    
    showFareButton.bind('click', updateContent);
    
    
    /**
     * Updates the fare output field content and shows the field to the user.
     */
    function updateContent() {

        // Request to get directions between origin and destination.
        var request = {
            origin: originInput.getElement().val(),
            destination: destinationInput.getElement().val(),
            travelMode: google.maps.DirectionsTravelMode.DRIVING       
        };
        
        // Calculate total fare and show it along with the total route distance.
        directionsService.route(request, function(response, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                totalDistance = new Decimal(
                    response.routes[0].legs[0].distance.value / 1000, 
                    3
                );
                
                distanceOverBase = new Decimal(
                    totalDistance - fare.distanceUnit, 
                    3
                );                
               
                distanceFare = new Decimal(
                    fare.ratePerDistanceUnit * 
                            Math.ceil(distanceOverBase / fare.distanceUnit), 
                    2
                );
 
                totalFare = new Decimal(fare.baseRate + distanceFare, 2);

                fareOutput.showFare(
                    totalFare.toCurrency('$'), 
                    totalDistance.toDistance(' km')
                );
            }
        });
    }
}


/**
 * This class represents a decimal number with a specified number of decimal 
 * places.
 *
 * @param {Number} amount The value to convert to a Decimal object.
 * @param {Number} decimalPlaces The number of decimal places this Decimal 
 *         object should have.
 */
var Decimal = function(amount, decimalPlaces) {
    this.amount = amount;
    this.decimalPlaces = decimalPlaces;
}
    

/**
 * Returns primitive value of Decimal object with given decimal accuracy.
 */ 
Decimal.prototype.valueOf = function() {
    var scale = 1;
        
    for(var i = 0; i < this.decimalPlaces; i++) {
        scale *= 10;
    }

    return Math.floor(this.amount * scale) / scale;
}


/**
 * Converts Decimal value to currency format.
 *
 * @param {String} unitPrefix The unit prefix to add to the returned currency
 *         amount string. 
 * @return {String} The given value as an amount of currency (i.e. as a decimal 
 *         with the given currency unit prefix).
 */
Decimal.prototype.toCurrency = function(unitPrefix) {
    return unitPrefix + Number(this).toFixed(2);
}


/**
 * Converts Decimal value to distance format.
 *
 * @param {String} unitSuffix The unit suffix to add to the returned distance 
 *         amount string. 
 * @return {String} The given amount as a distance (i.e. as a decimal with the
 *         given distance unit suffix).
 */
Decimal.prototype.toDistance = function(unitSuffix) {
    return Number(this).toFixed(3) + unitSuffix;
}