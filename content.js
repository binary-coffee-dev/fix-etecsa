window.addEventListener("load", function() {
	var urlBase = "https://www.portal.nauta.cu/useraaa/";
	
	chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
		switch(request.type) {
			case "get2-username":
				chrome.extension.sendMessage({
					type: "username", 
					data: {
						myProperty: document.querySelector('.z-depth-1 > div > div > div:nth-child(2) p').innerText
					}
				});
			break;
			case "get-location":
				chrome.extension.sendMessage({
					type: "location", 
					data: {
						location: document.location.href
					}
				});
			break;
			case "get-detail-summary":
				// console.log("get-detail-summary", request.data.year_month);
				DetailsSummary(request.data.year_month);
			break;
			case "get-detail-list":
				// console.log("get-detail-list", request.data);
				DetailsList(request.data.count, request.data.year_month, request.data.page);
			break;
		}
	});
	
	function DetailsSummary(year_month){
		var urlBase = "https://www.portal.nauta.cu/useraaa/";
		$.post(
			urlBase + "service_detail_summary", 
			"year_month=" + year_month + "&list_type=service_detail", 
			function(data){ 
				delete data.html;
				data.username = document.querySelector('.z-depth-1 > div > div > div:nth-child(2) p').innerText;
				data.service = document.querySelector('.z-depth-1 > div > div > div:nth-child(4) > div:nth-child(2) p').innerText;
				data.nautaHogar = document.querySelectorAll('.z-depth-1 > div > div > div').length > 7;
				// console.log("service_detail_summary", data);
				chrome.extension.sendMessage({
					type: "detail-summary", 
					data: data
				});
			},
		'json');
	}

	function DetailsList(count, year_month, page){
		let url = urlBase + "service_detail_list/" + year_month + "/" + count + ( page == 1? '' : '/' + page );
		$.get(url, function (data) {
			let xmlDoc = new DOMParser().parseFromString(data,'text/xml');
			let listElement = xmlDoc.querySelectorAll("table > tr");
			
			let result = {
				data:[],
				total_page: parseInt(xmlDoc.querySelectorAll('.pagination li:last-child')[0].textContent),
				page
			};

			for( let i = 0; i < listElement.length; i ++ ){
				result.data.push({ 
					in:listElement[i].children[0].innerHTML,
					fin:listElement[i].children[1].innerHTML,
					time:listElement[i].children[2].innerHTML,
					upload:listElement[i].children[3].innerHTML,
					download:listElement[i].children[4].innerHTML,
					importe:listElement[i].children[5].innerHTML,
				})
			}

			// console.log("service_detail_list", page, result);

			chrome.extension.sendMessage({
				type: "detail-list", 
				data: result
			});
		}, 'html');		
	}

}, true);

