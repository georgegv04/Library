const library = {
  booksList: [],

  addBook(title, author, pages, readStatus) {
    this.booksList.push({
      title,
      author,
      pages,
      readStatus,
    });
  },
};

library.addBook(
  "Ο Άγιος Παϊσιος ο Αγιορείτης",
  "Άγιος Παϊσιος",
  "665 pages",
  "Read",
);
library.addBook("Βίος και Λόγοι", "Άγιος Πορφύριος", "600 pages", "Read");
library.addBook(
  "The Brothers Karamazov",
  "Fyodor Dostoevsky",
  "885 pages",
  "Not read yet",
);

const libraryContainer = document.querySelector(".library-container");

for (let i = 0; i < library.booksList.length; i++) {
  let bookCard = document.createElement("div");
  bookCard.classList.add("book-card");

  let topGroup = document.createElement("div");
  topGroup.classList.add("top-group");

  let bookTitle = document.createElement("div");
  bookTitle.classList.add("book-title");
  bookTitle.textContent = library.booksList[i].title;
  topGroup.appendChild(bookTitle);

  let bookAuthor = document.createElement("div");
  bookAuthor.classList.add("book-author");
  bookAuthor.textContent = library.booksList[i].author;
  topGroup.appendChild(bookAuthor);

  let bottomGroup = document.createElement("div");
  bottomGroup.classList.add("bottom-group");

  let bookPages = document.createElement("div");
  bookPages.classList.add("book-pages");
  bookPages.textContent = library.booksList[i].pages;
  bottomGroup.appendChild(bookPages);

  let bookStatus = document.createElement("div");
  bookStatus.classList.add("book-status");
  bookStatus.textContent = library.booksList[i].readStatus;

  if (library.booksList[i].readStatus === "Read") {
    bookStatus.classList.add("status-read");
  } else {
    bookStatus.classList.add("status-not-read");
  }
  bottomGroup.appendChild(bookStatus);

  bookCard.appendChild(topGroup);
  bookCard.appendChild(bottomGroup);

  libraryContainer.appendChild(bookCard);
}
