const library = {
  booksList: [],

  addBook(title, author, pages, readStatus) {
    this.booksList.push({
      title,
      author,
      pages,
      isRead: readStatus,
    });
  },
};

library.addBook("Ο Άγιος Παϊσιος ο Αγιορείτης", "Άγιος Παϊσιος", 665, "Read");
library.addBook("Βίος και Λόγοι", "Άγιος Πορφύριος", 600, "Read");
library.addBook(
  "The Brothers Karamazov",
  "Fyodor Dostoevsky",
  885,
  "Not read yet",
);

const libraryContainer = document.querySelector(".library-container");

for (let i = 0; i < library.booksList.length; i++) {
  let bookCard = document.createElement("div");
  bookCard.classList.add("book-card");

  let bookTitle = document.createElement("div");
  bookTitle.classList.add("book-title");
  bookTitle.textContent = library.booksList[i].title;
  bookCard.appendChild(bookTitle);

  let bookAuthor = document.createElement("div");
  bookAuthor.classList.add("book-author");
  bookAuthor.textContent = library.booksList[i].author;
  bookCard.appendChild(bookAuthor);

  let bookPages = document.createElement("div");
  bookPages.classList.add("book-pages");
  bookPages.textContent = library.booksList[i].pages;
  bookCard.appendChild(bookPages);

  let bookStatus = document.createElement("div");
  bookStatus.classList.add("book-status");
  bookStatus.textContent = library.booksList[i].isRead;
  bookCard.appendChild(bookStatus);

  libraryContainer.appendChild(bookCard);
}
