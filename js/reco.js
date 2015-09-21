// anim

function active_aura(){
$(".moodbloc").toggleClass("off");
$(".wrapper-reco").toggleClass("off2");
$(".bkg-auragramme").toggleClass("off3");
$(".ham-menu").toggleClass("off-menu");
}

function active_burger(){
$(".ham-menu").toggleClass("open-menu");
}

 // fade/out menu

     $(window).scroll(function(){
	posScroll = $(document).scrollTop();
	if(posScroll >=200) 
		$('.ham-menu').addClass("on-menu");
	else
		$('.ham-menu').removeClass("on-menu");
}); 



  
        
      