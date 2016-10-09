var lat_bus,long_bus;
var loaded = 0;
$(function(){
	window.alert = function() {};
	
	initAutocomplete();
	switchScreen('screenDashboard');

	$('.screenDashboard #butt-car').click(function(){
		getTo();
		getFrom();
		if(loaded >= 2) {
			params = {from: [$('#lat-from').val(), $('#long-from').val()], to: [$('#lat-to').val(), $('#long-to').val()]};
			console.log(params);
			getFromAjax('trafficData', params);
			switchScreen("screenLoading");
		}
	});

	$('.screenDashboard #butt-uber').click(function(){
		window.location.replace("http://uber.com/");
	});

	$('.screenDashboard #watchme').click(function(){
		switchScreen('screenLoading');
		sleep(6000).then(() => {
		   switchScreen('screenWatchMe');
		   initMap2();
		});
	});

	$('.screenDashboard #butt-bus').click(function(){
		getTo();
		getFrom();
		if(loaded >= 2) {
			params = {from: [$('#lat-from').val(), $('#long-from').val()], to: [$('#lat-to').val(), $('#long-to').val()]};
			getFromAjax('nextBus', params);
			switchScreen("screenLoading");
		}
	});

	$('.return-butt').click(function(){
		switchScreen('screenDashboard');
		
	});
	
	function getFromAjax(func, params){
		endpoint = "ajax/ajax.php";
		params["f"] = func;
		$.post(endpoint, params, function(data) {
		  if(data.f){
		  	eval(data.f)(data);
		  }else{
		  	console.log(data.error);
		  }
		}, "json");
	}

	
	function showVehicule(params){
		// Update the risk
			var bar_p = (parseFloat(params["risk"])/4.0-Math.random())*100;
			$('.screenVehicle .progress-risk .rp').css("width", bar_p+"%");
			if(bar_p > 60)
				$('.screenVehicle .progress-risk .rp').css("background-color", "red");
			else if(bar_p > 30)
				$('.screenVehicle .progress-risk .rp').css("background-color", "orange");
			else 
				$('.screenVehicle .progress-risk .rp').css("background-color", "green");

		// Show the map
			/*var script = document.createElement('script');
			script.type = 'text/javascript';
			script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyCJNisvOSnwNCxOGaAdrtSpzVwBwIWV0wo&callback=initMap";
			$(".scripts").append(script);
			//$('.scripts').last().attr("async defer", "");*/

		// Update the realtime data
			var html = '';
			$.each(params["real-time"], function(k, v){
				html += '<div class="info"><h4>';
				html += v['title']+'</h4>';
				html += '<p>'+v['description']+'</p>';
				html += '</div>';
			});
			$('.screenVehicle .real-time').html(html);

		// Update the danger factor
			var bar1_p = (parseFloat(params["danger"])/4.0-Math.random())*100;
			$('.screenVehicle .danger-risk .dp').css("width", bar1_p+"%");
			if(bar1_p > 60)
				$('.screenVehicle .danger-risk .dp').css("background-color", "red");
			else if(bar1_p > 30)
				$('.screenVehicle .danger-risk .dp').css("background-color", "orange");
			else 
				$('.screenVehicle .danger-risk .dp').css("background-color", "green");

		initMap();
		switchScreen('screenVehicle');
	}
	
	function waitML(params){
		lat = $('#lat-to').val();
		lng = $('#long-to').val();
		ps = {f: "doSomeML", visibility: Math.ceil((params["visibility"]/10)*4), lat: lat, long: lng};
		$.post("ajax/ajax.php", ps, function(data) {

		  realtime = []
		  if(params.title){
		  	entry = {title: params.title, description:params.description};
		  	realtime.push(entry);
		  }

		  pss = {risk: data.risk, danger: data.danger, "real-time": realtime};
		  showVehicule(pss);

		}, "json");
	}

	function waitML2(params){
		lat = params.coordinates.start_location.lat;
		lng = params.coordinates.start_location.lng;

		
		var diff = Math.floor((params.coordinates.transit_details.departure_time.value-Math.round(new Date().getTime()/1000))/60);
		$('#waittime').html(diff+'min');
		$('#busstation').html(params.coordinates.transit_details.departure_stop.name);

		ps = {f: "doSomeML", visibility: 1, lat: lat, long: lng};

		$.post("ajax/ajax.php", ps, function(data) {

		  realtime = []
		  if(params.title){
		  	entry = {title: params.title, description:params.description};
		  	realtime.push(entry);
		  }


		  pss = {danger: data.danger};
		  showBus(pss);

		}, "json");
	}

	function showBus(params){
		comments = [{'name': 'Ali', 'comment': 'Look for the stores next to the bus stop, it may be safer for you.'}, 
		 {'name': 'Budi', 'comment':'I prefer staying next to people and not alone. Always be acompanied!'},
		 {'name':'Cooper', 'comment': 'Avoid this place at night, take an Uber, trust me it is worth it !'}];

		// Update the realtime data
			var html = '';
			$.each(comments, function(k, v){
				if(Math.random() > 0.3){
					html += '<div class="info"><h4>';
					html += v['name']+'</h4>';
					html += '<p>'+v['comment']+'</p>';
					html += '</div>';
				}
			});
			$('.screenBus .real-time').prepend(html);

		// Update the danger factor
			var bar1_p = (params["danger"]/4.0-Math.random())*100;
			$('.screenBus .danger-risk .dp').css("width", bar1_p);
			if(bar1_p > 60)
				$('.screenBus .danger-risk .dp').css("background-color", "red");
			else if(bar1_p > 30)
				$('.screenBus .danger-risk .dp').css("background-color", "orange");
			else 
				$('.screenBus .danger-risk .dp').css("background-color", "green");

		initMap1();
		switchScreen('screenBus');
	}


	function switchScreen(screen){
		$('.screen').hide();
		$('.'+screen).show();
	}

	function timeConverter(UNIX_timestamp){
		var a = new Date(UNIX_timestamp * 1000);
		var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
		var year = a.getFullYear();
		var month = months[a.getMonth()];
		var date = a.getDate();
		var hour = a.getHours();
		var min = a.getMinutes();
		var sec = a.getSeconds();
		var time = month+ ' '+ date + 'th at ' + hour;
		return time;
	}

});
