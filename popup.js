document.addEventListener('DOMContentLoaded', function () {

  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }

  var ul = document.getElementById('bookmarks');

  var toggleFavicons = document.getElementById('toggleFavicons');

  var enabledFavicons = localStorage.getItem('enableFavicons') !== 'false';

  toggleFavicons.checked = enabledFavicons;

  toggleFavicons.addEventListener('change', function () {
    enabledFavicons = this.checked;
    localStorage.setItem('enableFavicons', this.checked);
    renderBookmarks(
      enabledFavicons
    );
  });

  // Step 1: Add an input field for search
  var searchInput = document.getElementById('searchInput');

  // Step 2: Listen for 'input' event on the search field
  searchInput.addEventListener('input', debounce(function () {
    renderBookmarks(enabledFavicons, this.value);
  }, 300)); // 300ms delay


  function simpleSearch(term, text) {
    term = term.toLowerCase()?.split(' ');
    text = text.toLowerCase();

    return term.some(function (word) {
      return text.includes(word);
    })
  }

  const renderBookmarks = function (
    enabledFavicons,
    searchTerm = ''
  ) {

    Array.from(ul.children).forEach(function (li) {
      li.classList.add('hiding');
    });
    setTimeout(function () {
      // Clear the list after the transition
      ul.innerHTML = '';

      chrome.bookmarks.getTree(function (bookmarkTreeNodes) {
        var bookmarks = flattenBookmarks(bookmarkTreeNodes);

        if (searchTerm) {
          bookmarks = bookmarks.filter(bookmark => simpleSearch(searchTerm, bookmark.title + bookmark.url));
        }

        // Sort bookmarks by dateAdded
        bookmarks.sort((a, b) => b.dateAdded - a.dateAdded);

        // Get the 50 most recent bookmarks
        bookmarks = bookmarks.slice(0, 50);

        bookmarks.forEach(function (bookmark) {
          var li = document.createElement('li');
          li.classList.add('bookmark', 'hiding');
          var a = document.createElement('a');
          var img = document.createElement('img');
          var date = document.createElement('p');
          var deleteButton = document.createElement('button');



          a.href = bookmark.url;
          a.textContent = bookmark.title;
          a.target = '_blank';
          a.title = bookmark.url;

          var bookmarkDate = new Date(bookmark.dateAdded);
          date.textContent = 'Date added: ' + bookmarkDate.toLocaleDateString();

          deleteButton.textContent = 'Delete';
          deleteButton.classList.add('delete');
          deleteButton.addEventListener('click', function () {
            if (window.confirm('Are you sure you want to delete this bookmark?')) {
              chrome.bookmarks.remove(bookmark.id, function () {
                li.remove();
              });
            }
          });


          if (
            enabledFavicons
          ) {
            img.src = 'https://www.google.com/s2/favicons?domain=' + bookmark.url;
            img.style.height = '16px';
            img.style.width = '16px';
            img.style.marginRight = '5px';
            a.insertBefore(img, a.childNodes[0]);
          }

          li.appendChild(a);
          li.appendChild(date);
          li.appendChild(deleteButton);
          ul.appendChild(li);
          setTimeout(function () {
            li.classList.remove('hiding');
          }, 0);
        });
      });
    }, 0)

  }

  // Call renderBookmarks with the current search term
  renderBookmarks(enabledFavicons, searchInput.value);
});

function flattenBookmarks(bookmarkTreeNodes) {
  var bookmarks = [];

  bookmarkTreeNodes.forEach(function (node) {
    if (node.children) {
      bookmarks = bookmarks.concat(flattenBookmarks(node.children));
    } else {
      bookmarks.push(node);
    }
  });

  return bookmarks;
}
