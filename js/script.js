$(function(){
	
	document.addEventListener('touchstart', handleTouchStart, false);        
	document.addEventListener('touchmove', handleTouchMove, false);

	var xDown = null;                                                        
	var yDown = null;                                                        

	function handleTouchStart(evt) {                                         
	    xDown = evt.touches[0].clientX;                                      
	    yDown = evt.touches[0].clientY;                                      
	};                                                

	function handleTouchMove(evt) {
	    if ( ! xDown || ! yDown ) {
	        return;
	    }

	    var xUp = evt.touches[0].clientX;                                    
	    var yUp = evt.touches[0].clientY;

	    var xDiff = xDown - xUp;
	    var yDiff = yDown - yUp;

	    if ( Math.abs( xDiff ) > Math.abs( yDiff ) ) {
	        if ( xDiff <= 0 ) {
	           switchScreen('screenDashboard'); 
	        }                     
	    } else if ( yDiff <= 0 ) {
	         /* up swipe */                                                              
	    }
	    /* reset values */
	    xDown = null;
	    yDown = null;                                             
	};

	switchScreen('screenDashboard');

	$('.screenDashboard #butt-car').click(function(){

		params = {from: [$('#lat-from').val(), $('#long-from').val()], to: [$('#lat-to').val(), $('#long-to').val()]};
		console.log(params);
		getFromAjax('trafficData', params);
		switchScreen("screenLoading");
	});

	$('.screenDashboard #butt-bus').click(function(){
		params = {from: [$('#lat-from').val(), $('#long-from').val()], to: [$('#lat-to').val(), $('#long-to').val()]
				  };
		getFromAjax('nextBus', params);
		switchScreen("screenLoading");
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
			var bar_p = (params["risk"]/4.0)*100;
			$('.screenVehicle .progress-risk .rp').css("width", bar_p);
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
			var bar1_p = (params["danger"]/3.0)*100;
			$('.screenVehicle .danger-risk .dp').css("width", bar1_p);
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
		  	realtime.append(entry);
		  }

		  pss = {risk: data.risk, danger: data.danger, "real-time": realtime};
		  showVehicule(pss);

		}, "json");
	}

	function showBus(params){
		// Expected time
		
		// Show the map

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
			var bar1_p = (params["danger"]/3.0)*100;
			$('.screenVehicle .danger-risk .dp').css("width", bar1_p);

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
