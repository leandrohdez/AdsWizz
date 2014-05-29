//
//  AdsWizz.js
//  
//
//  Created by Leandro Hernandez on 30/04/14.
//  Copyright (c) 2014 Unocero Technologic. All rights reserved.
//
	
	// SET YOUR-URL-SERVER
	var SETTING_SERVER_URL 	= "http://kriteria.adswizz.com";
	// SET YOUR-AD-ZONE-ID
	var SETTING_AD_ZONE 	= "1574";
	// YOUR-COMPANION-ID
	var SETTING_COMPANION 	= "1575";
	
	var TAG_IMPRESSION 		= "Impression";
	var TAG_CUSTOM_CLICK 	= "CustomClick";
	var TAG_CLICK_THROUGH 	= "ClickThrough";
	var TAG_CREATIVE_VIEW 	= "creativeView";
	
	var EVENT_START 		= "start";
	var EVENT_FIRST_QUART 	= "firstQuartile";
	var EVENT_MIDPOINT 		= "midpoint";
	var EVENT_THIRD_QUART 	= "thirdQuartile";
	var EVENT_COMPLETE  	= "complete";
	
	var DEBUG_LOGS = false;
	
	function traceLogs(msg){
		if(DEBUG_LOGS) console.log(msg);
	}
	
	var CompanionResouceTypes = function () {
		this.StaticResource 	= "StaticResource";
		this.HTMLResourc	 	= "HTMLResource";
		this.IFrameResource 	= "IFrameResource";
	}
	var companionResouceTypes = new CompanionResouceTypes();
	

	var AdsWizzMediaFile = function () {
		this.width = 0;
		this.height = 0;
		this.delivery = "";
		this.type = "";
		this.bitrate = 0;
		this.source = "";
		this.duration = 0;
		this.trackingEvents = new Array();
		this.trackingEventsURL = new Array();
		
		this.setTrackingEvent = function(event, url){
			this.trackingEvents.push(event);
			this.trackingEventsURL.push(url);
		}
		
		this.getUrlTrackingByEvent = function(event){
			var url = "";
			if(this.trackingEvents.length == this.trackingEventsURL.length){
				for(var i=0;i<this.trackingEvents.length;i++){
					if(event == this.trackingEvents[i]){
						url = this.trackingEventsURL[i];
						break;
					}
				}
			}
			return url;
		}
	}

	
	var AdsWizzRequestObject = function () {
		this.server = SETTING_SERVER_URL;
		this.zone = SETTING_AD_ZONE;
		this.companionZone = SETTING_COMPANION;
	}


	var AdsWizzCompanionAd = function () {
		this.cid = 0;
		this.width = 0;
		this.height = 0;
		this.source = "";
		this.companionType = "";		// StaticResource | HTMLResource | IFrameResource
		this.creativeType = ""; 		// representa a los companion de tipo StaticResource o sea png, gif, jpg, swf, etc
		this.trackingCreativeView = "";
	}

	
	var AdsWizzResponseObject = function () {
		this.rid = "";
		this.mediaFile = new AdsWizzMediaFile();
		this.companionAd = new AdsWizzCompanionAd();
		this.impressionTrack = "";
		this.clickTrack = "";
		this.clickThrough = "";
		
		this.trackEvent = function(eventName){
			var url = "";
			if(eventName == TAG_IMPRESSION){
				url = this.impressionTrack;
			}
			
			else if(eventName == TAG_CUSTOM_CLICK){
				url = this.clickTrack;
			}
			
			else if(eventName == TAG_CREATIVE_VIEW){
				url = this.companionAd.trackingCreativeView;
			}
			
			else{
				url = this.mediaFile.getUrlTrackingByEvent(eventName);
			}
						
			if (url != "") {
				// HAGO EL TRACK QUE CORRESPONDA Y ME DESENTIENDO DE LA RESPUESTA
				$.ajax({
					type: "GET",
					url: url,
					async: false,
					success: null,
					error: null,
					failure: null
				});
				
				/*debug*/ traceLogs("TRACK: "+eventName+" realizado");
			}
		}
		
		this.trackImpression = function(){
			this.trackEvent(TAG_IMPRESSION);
		}
		
		this.trackStart = function(){
			this.trackEvent(EVENT_START);
		}
		
		this.trackFirstQuartile = function(){
			this.trackEvent(EVENT_FIRST_QUART);
		}
		
		this.trackMidPoint = function(){
			this.trackEvent(EVENT_MIDPOINT);
		}
		
		this.trackThirdQuartile = function(){
			this.trackEvent(EVENT_THIRD_QUART);
		}
		
		this.trackComplete = function(){
			this.trackEvent(EVENT_COMPLETE);
		}
		
		this.trackClick = function(){
			this.trackEvent(TAG_CUSTOM_CLICK);
		}
		
		this.trackCreativeView = function(){
			this.trackEvent(TAG_CREATIVE_VIEW);
		}
	}

	
	var AdsWizzManager = function () {
		
		var responseObject = new AdsWizzResponseObject();
		
		this.requestAd = function(){
			var urlString = ""+SETTING_SERVER_URL+"/www/delivery/swfIndex.php?zoneId="+SETTING_AD_ZONE+"&protocolVersion=2.0&reqType=AdsSetup&companionZones="+SETTING_COMPANION;
			
			$.ajax({
				type: "GET",
				url: urlString,
				dataType: "xml",
				async: false,
				success: this.onSuccessRequest,
				error: this.onFailureRequest
			});
		}
		
		this.onSuccessRequest = function(responseXML){
			/*debug*/ traceLogs("****************************************************");
			var xml2 = load_xml(responseXML);
			recursiveXMLParser($(xml2)[0]);
			/*debug*/ traceLogs("======= COMPLETADO EL PARSER DEL XML =======");
			/*debug*/ traceLogs("El recurso recibido es de tipo: "+responseObject.mediaFile.type);
		}
		
		this.onFailureRequest = function(){
		
		}
		
		
		function load_xml(msg) {   
			if ( typeof msg == 'string') {
				if (window.DOMParser)//Firefox
				{
					parser=new DOMParser();
					data=parser.parseFromString(text,"text/xml");
				}else{ // Internet Explorer
					data=new ActiveXObject("Microsoft.XMLDOM");
					data.async="false";
					data.loadXML(msg);
				}
			} else {
				data = msg;
			}
			return data;
		}
		
		function secondsForTimeString(string){
			var components = string.split(":");
			
			var hours 	= eval(components[0]);
			var minutes = eval(components[1]);
			var seconds = eval(components[2]);
			
			return (hours * 60 * 60) + (minutes * 60) + seconds;
		}
		
		this.timeBetweenEvents = function(){
			return responseObject.mediaFile.duration/4;
		}
		
		this.getResponseObject = function(){
			return responseObject;
		}

		function recursiveXMLParser (xmlarray){
			var size = xmlarray.childNodes.length;
			
			for(var i=0;i<size;i++){
				
				// AKI VAN LOS PARSERS DEL XML
				if(xmlarray.childNodes[i].nodeName == "Ad"){
					responseObject.rid = xmlarray.childNodes[i].attributes.getNamedItem("id").value;
					
					/*debug*/ traceLogs("Encontrado <Ad> y guardado el id del AdWizz [ID = "+responseObject.rid+"]");
				}
				
				if (xmlarray.childNodes[i].nodeName == "MediaFile" && !xmlarray.childNodes[i].attributes.getNamedItem("apiFramework")) {
					responseObject.mediaFile.delivery 	= xmlarray.childNodes[i].attributes.getNamedItem("delivery").value;
					responseObject.mediaFile.bitrate 	= xmlarray.childNodes[i].attributes.getNamedItem("bitrate").value;
					responseObject.mediaFile.width 		= xmlarray.childNodes[i].attributes.getNamedItem("width").value;
					responseObject.mediaFile.height		= xmlarray.childNodes[i].attributes.getNamedItem("height").value;
					responseObject.mediaFile.type		= xmlarray.childNodes[i].attributes.getNamedItem("type").value;
					
					/*debug*/ traceLogs("Encontrado <MediaFile> y guardado los parametros en el responseObject ");
					
					if (responseObject.mediaFile.source.length == 0) {
						responseObject.mediaFile.source = xmlarray.childNodes[i].textContent;
						
						/*debug*/ traceLogs(" --- Guardado el source para <MediaFile> ");
					}
				}
				
				if (xmlarray.childNodes[i].nodeName == "Companion") {
					responseObject.companionAd.cid 		= xmlarray.childNodes[i].attributes.getNamedItem("id").value;
					responseObject.companionAd.width 	= xmlarray.childNodes[i].attributes.getNamedItem("width").value;
					responseObject.companionAd.height 	= xmlarray.childNodes[i].attributes.getNamedItem("height").value;
					
					/*debug*/ traceLogs("Encontrado <Companion> y guardado los parametros en el companionAd ");
				}
				
				if (xmlarray.childNodes[i].nodeName == "StaticResource") {
				
					responseObject.companionAd.companionType = companionResouceTypes.StaticResource;
				
					responseObject.companionAd.creativeType = xmlarray.childNodes[i].attributes.getNamedItem("creativeType").value;
					responseObject.companionAd.source = xmlarray.childNodes[i].textContent;
					
					/*debug*/ traceLogs("Encontrado <StaticResource> y guardado el source y el creativeType = "+responseObject.companionAd.creativeType);
				}
				
				if (xmlarray.childNodes[i].nodeName == "HTMLResource") {
				
					responseObject.companionAd.companionType = companionResouceTypes.HTMLResource;
					
					responseObject.companionAd.source = xmlarray.childNodes[i].textContent;
					
					/*debug*/ traceLogs("Encontrado <HTMLResource> y guardado el HTML");
				}
				
				if (xmlarray.childNodes[i].nodeName == "IFrameResource") {
					
					responseObject.companionAd.companionType = companionResouceTypes.IFrameResource;
					
					responseObject.companionAd.source = xmlarray.childNodes[i].textContent;
					
					/*debug*/ traceLogs(" --- Guardado el HTML para <IFrameResource> y guardado la url");
				}
				
				if (xmlarray.childNodes[i].nodeName == "Tracking") {
					var trackingEventType = xmlarray.childNodes[i].attributes.getNamedItem("event").value;
					var trackingURL = xmlarray.childNodes[i].textContent;
					
					if (trackingEventType == TAG_CREATIVE_VIEW) {
						responseObject.companionAd.trackingCreativeView = xmlarray.childNodes[i].textContent;
						
						/*debug*/ traceLogs("Encontrado <Tracking> y guardado el trackingEventType = "+trackingEventType+" en el CompanionAd");
					}
					else {
						responseObject.mediaFile.setTrackingEvent(trackingEventType, trackingURL);
						
						/*debug*/ traceLogs("Encontrado <Tracking> y guardado el trackingEventType = "+trackingEventType+" en el MediaFile");
					}
				}
				
				if (xmlarray.childNodes[i].nodeName == TAG_IMPRESSION && responseObject.impressionTrack.length == 0) {
					responseObject.impressionTrack = xmlarray.childNodes[i].textContent;
					
					/*debug*/ traceLogs("Encontrado <"+TAG_IMPRESSION+"> y guardado el impressionTrack ");
				}
	
				if (xmlarray.childNodes[i].nodeName == TAG_CLICK_THROUGH) {
					responseObject.clickThrough = xmlarray.childNodes[i].textContent;
					
					/*debug*/ traceLogs("Encontrado <"+TAG_CLICK_THROUGH+"> y guardado el clickThrough ");
					/*debug*/ traceLogs(" --- ONCLICK Redirect to: ("+responseObject.clickThrough+")");
				}
				
				if (xmlarray.childNodes[i].nodeName == TAG_CUSTOM_CLICK) {
					responseObject.clickTrack = xmlarray.childNodes[i].textContent;
					
					/*debug*/ traceLogs("Encontrado <"+TAG_CUSTOM_CLICK+"> y guardado el clickTrack ");
				}
				
				if (xmlarray.childNodes[i].nodeName == "CompanionClickThrough") {
					responseObject.clickThrough = xmlarray.childNodes[i].textContent;
					
					/*debug*/ traceLogs("Encontrado <CompanionClickThrough> y guardado el clickThrough ");
				}
				
				if (xmlarray.childNodes[i].nodeName == "Duration") {
					responseObject.mediaFile.duration = secondsForTimeString(xmlarray.childNodes[i].textContent);
					
					/*debug*/ traceLogs("Encontrado <Duration> y guardado el resultado del calculo de segundos ");
				}
				
				
				// HAGO LA LLAMADA RECURSIVA PARA LOS HIJOS
				if(xmlarray.childNodes[i].childNodes.length > 0)
					recursiveXMLParser(xmlarray.childNodes[i]);
			}
		}
	}

	
	













































