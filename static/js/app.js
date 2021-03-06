console.log("app.js started.");
GOOGLE_API_KEY = 'AIzaSyCMgw5bWf-ZIGIsUYcFgK8v5_4uQeJUTzE';

$(document).ready(function() {
	var map = L.map('map').setView([33.448376, -112.074036], 13);
	var mapMarkers = [];

	L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
			attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
			maxZoom: 18,
			id: 'mapbox.satellite',
			accessToken: 'pk.eyJ1IjoiZ2VvZmZodyIsImEiOiJjaXh4a2d3Z3EwMDNrMnFsYWx3Z3Axd2R4In0.NYeciTJrObuu0VdFqR4D4w'
	}).addTo(map);

	toastr.options = {
	  "closeButton": false,
	  "debug": false,
	  "newestOnTop": false,
	  "progressBar": false,
	  "positionClass": "toast-bottom-center",
	  "preventDuplicates": true,
	  "onclick": null,
	  "showDuration": "300",
	  "hideDuration": "1000",
	  "timeOut": "5000",
	  "extendedTimeOut": "1000",
	  "showEasing": "swing",
	  "hideEasing": "linear",
	  "showMethod": "fadeIn",
	  "hideMethod": "fadeOut"
	}

	map.scrollWheelZoom.disable();

	var submitButton = $('#submit_button');
	var searchBar = $('#locationForm');

	submitButton.on('click', function() {
		console.log("submit clicked!");
		mapMarkers.forEach(function(marker) {
			map.removeLayer(marker);
		});
		mapMarkers = [];
		var terms = $('#terms').val()

		submitButton.attr("disabled", true);

		/*if ($('#museum').is(":checked"))
			terms.push("museum");
		if ($('#sports').is(":checked"))
			terms.push("sports");
		if ($('#music').is(":checked"))
			terms.push("music");*/

		console.log(terms);
		address = searchBar.val();
		var latitude = 0;
		var longitude = 0;

		toastr.success('Your schedule is being generated. Please be patient.', 'Loading...')

		$.ajax({
	      url: generateGoogleURL(address),
	      success: function (data) {
	        if(data.results.length > 0) {
	        	var location = data.results[0].geometry.location;
						latitude = location.lat;
						longitude = location.lng;
	        }
	      }
	  }).done(function() {
			getDataFromServer(terms, latitude, longitude, function(json) {
				console.log(json);
				var morningActivities = json.morning_activities;
				var afternoonActivities = json.afternoon_activities;

				var breakfast = json.breakfast;
				var lunch = json.lunch;
				var dinner = json.dinner;

				var schedule = [];
				schedule.push(breakfast);
				appendArray(schedule, morningActivities);
				schedule.push(lunch);
				appendArray(schedule, afternoonActivities);
				schedule.push(dinner);

				for(var i = 0; i < schedule.length; i++) {
					var marker = addMarker(map, schedule[i]);
					mapMarkers.push(marker);

					if(i != 0) {
						var prev = schedule[i - 1];
						var curr = schedule[i];

						var polyline = createPath(map, prev.latitude, prev.longitude, curr.latitude, curr.longitude);
						mapMarkers.push(polyline);
					}
				}

				scrollToMap();
				var group = new L.featureGroup(mapMarkers);
				map.fitBounds(group.getBounds().pad(0.0));

				submitButton.attr("disabled", false);
			});
		});
	});
});

function scrollToMap() {
	$('html, body').animate({
        scrollTop: $("#map_section").offset().top - 100
    }, 2000);
}

function addMarker(map, activity){
	console.log("addMarker called.");

	var marker = L.marker([activity.latitude, activity.longitude]).addTo(map);
	var popupHTML = '<div class="marker-popup">';

	if(activity.image_list != null) {
		popupHTML += '<img class="popup-image" src="' + activity.image_list + '">'
	}

	popupHTML += "<b>" + activity.name + "</b>";

	if(activity.rating != null) {
		popupHTML += "<b> (" + activity.rating + "/5 rating)</b><br><br>"
	}

	/*popupHTML += '<div class="progress"><div class="progress-bar" role="progressbar" style="width: 15%" aria-valuenow="' + activity.rating + '" aria-valuemin="0" aria-valuemax="5"></div></div>';*/
	if(activity.description != null) {
		popupHTML += activity.description;
	}
	popupHTML += '</div>';

	marker.bindPopup(popupHTML);
	return marker;
}

function createPath(map, lat1, long1, lat2, long2){
	coords = [[lat1, long1], [lat2, long2]];

	var polyline = L.polyline(coords).addTo(map);
	return polyline;
}

function appendArray( mainArray,  arrayToAdd) {
	for (var i = 0 ; i < arrayToAdd.length; i++) {
		mainArray.push(arrayToAdd[i]);
	}
}

function getDataFromServer(terms, latitude, longitude, cb){
	var xhr = new XMLHttpRequest();

	var url = "https://hack-az.herokuapp.com/simulate?"
			   		+ "lat=" + latitude + "&long=" + longitude;

	if(terms != '') {
		url += "&terms=" + terms;
	}

	console.log(url);

	xhr.onload = function() {
		var response = xhr.responseText;
		var json = JSON.parse(response);
		cb(json);
	}
	xhr.open("GET", url);

	xhr.send();
}

function generateGoogleURL(address) {
	var url = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + encodeURI(address) + '&key=' + GOOGLE_API_KEY;
	return url;
}
