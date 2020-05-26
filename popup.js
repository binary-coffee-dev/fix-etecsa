window.onload = function() {
	var data = null;

	chrome.tabs.getSelected(null, function(tab){
		chrome.tabs.sendMessage(tab.id, {type: "get-location"});
	});
	
	document.getElementById("details").onclick = function() {
		addLoading();
		chrome.tabs.getSelected(null, function(tab){
			chrome.tabs.sendMessage(tab.id, {type: "get-detail-summary",
				data:{ 
					year_month:"2020-" + document.getElementById("month").value
				} 
			});
		});
	}

	document.getElementById("btnHome").onclick = function(){
		window.open('https://www.portal.nauta.cu/useraaa/user_info');
	};
	
	chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
		switch(request.type) {
			case "username":
				document.getElementsByTagName('body')[0].innerHTML  = request.data.myProperty;
			break;
			case "location":
				let href = request.data.location;
				if( href == "https://www.portal.nauta.cu/useraaa/user_info" ){
					document.getElementById("btnHome").remove();
					document.getElementById("idDetails").hidden = false;
				}else 
					document.getElementById("idDetails").remove();
			break;
			location
			case "detail-summary":
				data = JSON.parse(JSON.stringify(request.data));

				if( data.count == 0 ){
					let html = '<h4>Detalles:</h4>';
					html += '<p>No hay conexiones en este mes.</p>';
					document.getElementsByClassName('details')[0].innerHTML=html;
					removeLoading();
				}else{
					chrome.tabs.getSelected(null, function(tab){
						chrome.tabs.sendMessage(tab.id, {type: "get-detail-list", 
							data:{ 
								year_month:data.year_month,
								count:data.count,
								page:1
							} 
						});
					});
				}
				
			break;
			case "detail-list":
				if( !data.list )
					data.list = request.data.data;
				else
					data.list = data.list.concat( request.data.data );

				data.total_page = parseInt(request.data.total_page);
				updateLoading(request.data.page);

				if( request.data.page >= request.data.total_page || request.data.page > 100 ){
					removeLoading();

					let timeFalt = timeFaltantes();
					let hashtags = "EtecsaDevuelvemeLasHoras,BajenLosPreciosDeInternet"

					let html = '<h4>Detalles:</h4><table>';
					html += "<tr><td>Mes:</td><td>" + data.year_month + "</td></tr>";
					html += "<tr><td>Conexiones:</td><td>" + data.count + "</td></tr>";
					html += "<tr><td>Subida:</td><td>" + data.upstream_traffic/1000000 + "GB</td></tr>";
					html += "<tr><td>Descarga:</td><td>" + data.download_traffic/1000000 + "GB</td></tr>";
					// html += "<tr><td>Tráfico total:</td><td>" + data.total_traffic/1000000 + "GB</td></tr>";
					html += "<tr><td>Tiempo total:</td><td>" + formatTime(data.duration) + "</td></tr>";
					html += "<tr><td>Importe Total:</td><td>" + data.import + "</td></tr>";
					html += "<tr><td>Faltantes:</td><td>" + timeFalt.time + "</td></tr>";
					html += "<tr><td>Faltantes (CUC):</td><td>" + timeFalt.import + "</td></tr>";
					html += "</table>";
					html += "<a id='twitter' target='bank' href='https://twitter.com/intent/tweet?text=@ETECSA_Cuba me faltan "+timeFalt+" horas de las contratadas en el mes "+data.year_month+"&hashtags="+hashtags+"' ><img src='./twitter.jpg'/>Tweet</a>";

					document.getElementsByClassName('details')[0].innerHTML=html;
					break;
				}

				chrome.tabs.getSelected(null, function(tab){
					chrome.tabs.sendMessage(tab.id, {type: "get-detail-list", 
						data:{ 
							year_month:data.year_month,
							count:data.count,
							page:request.data.page + 1
						} 
					});
				});
			break;
		}
		return true;
	});

	var listPrice = [
		{
			time: 1588305600000,
			price: 30
		},
		{
			time: 9588305600000,
			price: 1
		},
	]

	function getMod(d){
		let time = new Date(d.substr(6,4), d.substr(3,2)-1, d.substr(0,2))

		for( let i = 0; i < listPrice.length; i ++ )
			if( time < listPrice[i].time ){
				return ( i == 0 )? 72 : (3600/listPrice[i-1].price).toFixed();
			}

		return 72;
	}

	function timeFaltantes(list){
		let mod;
		let falt = 0;
		for( let it of data.list ){
			mod = 52;//4 de enero

			if( data.nautaHogar && ( data.service.indexOf("International") != -1 || data.service.indexOf("Internacional") != -1 )  )
				mod = getMod( it.in );
			else
				if( data.service.indexOf("International") == -1 && data.service.indexOf("Internacional") == -1 )
					mod = 360;//antes 2020

			let tmp = it.time.split(":");
			let tim = tmp[0]*3600 + tmp[1]*60 + tmp[2]*1;
			falt += (tim%mod == 0)? 0 : mod - tim%mod;
		}

		let t = falt/mod;
		
		return {
			time:formatTime(falt),
			import: t.toFixed() / 100
		}
	}


	function formatTime(num){
		num = parseInt(num);
		let h = parseInt(num / 3600);
		let m = parseInt((num%3600) / 60);
		let s = parseInt(num%60);
		let res = ( h < 10? "0" : "" ) + h + ":";
		res += ( m < 10? "0" : "" ) + m + ":";
		res += ( s < 10? "0" : "" ) + s;

		return res;
	}

	function addLoading(){
		let element = document.createElement('div');
		element.className = "loadingContent";
		element.innerHTML = "<div class='loadingBar'><div class='loadingBarOn'></div></div>";
		document.body.append(element);
	}
	
	function updateLoading(page){
		if( data.total_page > 0 )
			document.getElementsByClassName('loadingBarOn')[0].style.width = ( (page/data.total_page) * 100 ) + "%";
		else
			document.getElementsByClassName('loadingBarOn')[0].style.width = "100%";
	}
	
	function removeLoading(){
		document.getElementsByClassName("loadingContent")[0].remove();
	}

	
}