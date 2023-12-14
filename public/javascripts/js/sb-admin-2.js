(function($) {
  "use strict"; // Start of use strict

  // // Toggle the side navigation
  // $("#sidebarToggle, #sidebarToggleTop").on('click', function(e) {
  //   $("body").toggleClass("sidebar-toggled");
  //   $(".sidebar").toggleClass("toggled");
  //   if ($(".sidebar").hasClass("toggled")) {
  //     $('.sidebar .collapse').collapse('hide');
  //   };
  // });

  // // Close any open menu accordions when window is resized below 480px
  // $(window).resize(function() {
  //   if ($(window).width() < 480) {
  //     $('.sidebar .collapse').collapse('hide');
  //   };

    

    
  //   // Toggle the side navigation when window is resized below 480px
  //   if ($(window).width() < 480 && !$(".sidebar").hasClass("toggled")) {
  //     $("body").addClass("sidebar-toggled");
  //     $(".sidebar").addClass("toggled");
  //     $('.sidebar .collapse').collapse('hide');
  //   };
  // });

  // Prevent the content wrapper from scrolling when the fixed side navigation hovered over
  $('body.fixed-nav .sidebar').on('mousewheel DOMMouseScroll wheel', function(e) {
    if ($(window).width() > 768) {
      var e0 = e.originalEvent,
        delta = e0.wheelDelta || -e0.detail;
      this.scrollTop += (delta < 0 ? 1 : -1) * 30;
      e.preventDefault();
    }
  });

  // Scroll to top button appear
  $(document).on('scroll', function() {
    var scrollDistance = $(this).scrollTop();
    if (scrollDistance > 100) {
      $('.scroll-to-top').fadeIn();
    } else {
      $('.scroll-to-top').fadeOut();
    }
  });

  // Smooth scrolling using jQuery easing
  $(document).on('click', 'a.scroll-to-top', function(e) {
    var $anchor = $(this);
    $('html, body').stop().animate({
      scrollTop: ($($anchor.attr('href')).offset().top)
    }, 1000, 'easeInOutExpo');
    e.preventDefault();
  });

})(jQuery); // End of use strict

// JavaScript to toggle small screen navigation visibility
const smallScreenNav = document.querySelector(".small-screen-nav");
const sidebarToggleTop = document.getElementById("sidebarToggleTop");

sidebarToggleTop.addEventListener("click", function (event) {
    // Prevent the click event from propagating to the document
    event.stopPropagation();
    smallScreenNav.classList.toggle("active");
});

// Add event listener to hide small screen nav when clicking outside
document.addEventListener("click", function () {
    if (smallScreenNav.classList.contains("active")) {
        smallScreenNav.classList.remove("active");
    }
});



