var map, postMap;
var lastPostMarker;
const DOMAIN = "http://www.sicherheit.st";
window.initMap = function() {
	let GrazCoords = { lat: 47.07018099431958, lng: 15.439704404807907 };
	map = new google.maps.Map(document.getElementById("map"), {
		center: GrazCoords,
		zoom: 17,
		disableDefaultUI: true,
		myLocationEnabled: true
		});
		
	postMap = new google.maps.Map(document.getElementById("post-map"), {
		center: GrazCoords,
		zoom: 17,
		disableDefaultUI: true,
		myLocationEnabled: true
		});
};
var rememberedFields = ['username', 'phone', 'e-mail', 'instagram', 'telegram'];

function homeLoad() {
	//get images
	$.get(`${DOMAIN}/getPhotos.php?deviceId=${device.uuid}`, 
	function(response) {
		$images = response;
		if($images.length) {
			$('#last-photos').html('<h2 class="center-text">Deine vorherigen Beiträge</h2>');
		} else {
			$('#last-photos').html('<div class="center-text no-commits"><img src="img/no-commits.svg"></div>');
		}
		
		$images.forEach(image => {
			$('#last-photos').append(`<div class="gallery" data-id="${image.id}" style="background: url('data:image/jpg;base64,${image.thumb}')"></div>`)
		});
		$('.gallery').click(LaunchDetailsPage);
	});
}

function getPhotoFromCamera() { 
		navigator.camera.getPicture(onPhotoSuccess, onFail, { 
		quality: 85, 
		sourceType: navigator.camera.PictureSourceType.CAMERA, 
		destinationType: navigator.camera.DestinationType.DATA_URL, 
	}); 
} 
function getPhotoFromAlbum(){ 
	navigator.camera.getPicture(onPhotoSuccess, onFail,{ 
		quality: 85, 
		sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY, 
		destinationType: navigator.camera.DestinationType.DATA_URL 
	}); 
} 
function onPhotoSuccess(imageData){ 
	$('input[name=image]').val(imageData);
	LaunchGPSPage();
}
function onFail(message){ 
	if(message == "20") {
		alert("Du musst den Zugriff auf deine Galerie erlauben");
	}
	else {
		alert("Es wurde kein Foto ausgewählt");
	}
}

function closeKeyboardOnSwipe() {
	$('input, textarea').blur();
}

function LaunchGPSPage() {
	location.hash = "#geolocation";
	centerMapToUser();
}
function LaunchContactForm() {
	location.hash = "#contactform";
	$('.loading-bg').addClass('hidden');
}

function contactLoad() {
	$('textarea[name=comment]').val('');
	$('input[name=lat]').val(map.center.lat());
	$('input[name=lon]').val(map.center.lng());
	$('input[name=uuid]').val(device.uuid);
	// load fields
	rememberedFields.forEach(item => {
		$('#'+item).val(window.localStorage.getItem(item));
	});
}

function centerMapToUser() {
	navigator.geolocation.getCurrentPosition(
		(position) => {
			let latLng = {
				lat: position.coords.latitude,
				lng: position.coords.longitude
			};
			map.setCenter(latLng);
			
			new google.maps.Marker({
				position: latLng,
				map: map,
				icon: {
					path: google.maps.SymbolPath.CIRCLE,
					scale: 10,
					fillOpacity: 1,
					strokeWeight: 2,
					fillColor: '#5384ED',
					strokeColor: '#ffffff',
				},
			});
		},
		function onError(error) {
			alert('code: '    + error.code    + '\n' +
		  'message: ' + error.message + '\n');
		},{
			enableHighAccuracy: false
		});
}
function LaunchThanksPage() {
	location.hash = "#home-page";
	showMessage("Herzlichen Dank,<br>dein Hinweis ist bei uns eingegangen");
}


function validateForm(e) {
	e.preventDefault();

	let valid = true;

	let usernameInput = $("#contact-info .username");
	let emailInput = $("#contact-info .email");
	let phoneInput = $("#contact-info .phone");
	$(".error-label").html("");
	$('.ui-input-text').removeClass("input-error");

	if(usernameInput.val().length < 5) {
		$(".name-error").html("Bitte gib deinen vollen Namen ein");
		usernameInput.parent().addClass("input-error");
		valid = false;
	}
	if(emailInput.val().length < 5 && phoneInput.val().length < 5) {
		$(".contact-error").html("Bitte gib entweder deine E-Mail Adresse oder deine Telefonnummer ein");
		emailInput.parent().addClass("input-error");
		phoneInput.parent().addClass("input-error");
		valid = false;
	}
	if (valid) {
		let data = $('#contact-info').serialize();
		$('.loading-bg').removeClass('hidden')
		$.post(`${DOMAIN}/upload.php`, data, LaunchThanksPage)
			.fail(showError);
		// save fields
		rememberedFields.forEach(item => {
			window.localStorage.setItem(item, $('#'+item).val());
		});
	}
}

var postId;
function LaunchDetailsPage() {
	location.hash = "#details";
	postId = this.getAttribute('data-id');
	$("#details .loading-spinner").removeClass('hidden');
	$("#details-content").addClass('hidden');
	$.get(`${DOMAIN}/getPost.php?id=${postId}`,
	function(response) {
		$post = response;
		$html = `
		<div class="center-text">
			<img class="main-photo" src="data:image/jpg;base64,${$post.image}">
			<span style="float: left;">${moment($post.date).format('MMM DD, YYYY HH:mm')}</span>
			<span style="float: right; font-weight: bold;">${$post.username}</span>
		</div><br><hr/>`;
		if($post.comment) {
			$html += `
			<div class="center-text"><h3>Dein Hinweis:</h3></div>
			<span>${$post.comment}</span>`;
		}
		else {
			$html += `<span>Bitte beschreibe uns dein Anliegen</span>`;
		}
		$('#post-details').html($html);
		if($post.phone || $post.email || $post.instagram || $post.telegram) {
			$html = `<div class="center-text"><h3>Deine Kontaktdaten:</h3></div>
						<div class="contacts">`;
			if($post.phone)
				$html += `<div class="phone">${$post.phone}</div>`;
			if($post.email) 
				$html += `<div class="email">${$post.email}</div>`;
			if($post.instagram) 
				$html += `<div class="instagram">${$post.instagram}</div>`;
			if($post.telegram) 
				$html += `<div class="telegram">${$post.telegram}</div>`;
			$html += `</div><hr/>`;
			$('#post-contacts').html($html);
		}
		$("#details .loading-spinner").addClass('hidden');
		$("#details-content").removeClass('hidden');
		let pos = { lat: parseFloat($post.lat), lng: parseFloat($post.lon) };
		postMap.setCenter(pos);
		map.setZoom(17);
		if(lastPostMarker != null) {
			lastPostMarker.setMap(null);
		}
		var lastPostMarker = new google.maps.Marker({
			position: pos,
			map: postMap
		});
			
	});
}

function showModal(page) {
	$(`#${page} .modal-container`).removeClass('hidden-animated');
}
function hideModal(page) {
	$(`#${page} .modal-container`).addClass('hidden-animated');
}

function showDeleteModal() {
	showModal("details");
}
function hideDeleteModal() {
	hideModal("details");
}
function showError() {
	$('.loading-bg').addClass('hidden');
	showModal("contactform");
}
function hideError() {
	hideModal("contactform");
}
function showMessage(msg) {
	showModal("home-page");
	$("#home-page .modal-container h3").html(msg);
}
function hideMessage() {
	hideModal("home-page");
}

function deletePost() {
	$.post(`${DOMAIN}/deletePost.php`, {id: postId})
	.success(function() {
		location.hash = "#home-page";
		showMessage("Dein Hinweis wurde gelöscht");
		hideDeleteModal();
	});
}

$(function() {
	$('#get-album-photo').click(getPhotoFromAlbum);
	$('#get-camera-photo').click(getPhotoFromCamera);
	$('#accept-geo').click(LaunchContactForm);
	
	$('#remove-post').click(showDeleteModal);
	$('#details .modal button.yes').click(deletePost);
	$('#details .modal button.close').click(hideDeleteModal);
	$('#contactform .modal button.close').click(hideError);
	$('#home-page .modal button.close').click(hideMessage);
	
	$('#contactform [data-role="main"]').bind('scroll', closeKeyboardOnSwipe);

	$("#contact-info").submit(validateForm);
	$(document).on("deviceready", homeLoad);
	$(document).on('pageshow', '#home-page', homeLoad);
	$(document).on('pageshow', '#contactform', contactLoad);
});
