jQuery(function($) {
	var path = window.location.pathname;

  $('#sidebar-toggle').click(function(e) {
		e.preventDefault();
		$('body').toggleClass("sidebar-collapse");
	});

  $('.sidebar-nav a').filter(function(idx, link) {
    if (link.getAttribute('href') === path) {
      link.classList.add('is-active');
    }
  });

});
