document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menu-toggle');
    const menu = document.querySelector('.menu');
    
    // Toggle the menu visibility when the menu icon is clicked
    menuToggle.addEventListener('click', function() {
        if (menu.classList.contains('open')) {
            menu.classList.remove('open');
        } else {
            menu.classList.add('open');
        }
    });
});
