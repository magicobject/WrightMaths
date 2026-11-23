/* Runs before first paint: lets book.css hide hints and solutions only when the
   interactive script is going to take over (book.mjs removes this class again
   if it fails, so nothing is ever hidden for good). */
document.documentElement.classList.add('js');
