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

library.addBook("Ο Άγιος Παϊσιος ο Αγιορείτης", "Άγιος Παϊσιος", 665, true);
library.addBook("Βίος και Λόγοι", "Άγιος Πορφύριος", 600, true);
library.addBook("The Brothers Karamazov", "Fyodor Dostoevsky", 885, false);

const libraryContainer = document.querySelector(".library-container");

for (let i = 0; i < library.booksList.length; i++) {
  let bookCard = document.createElement("div");
  bookCard.classList.add("book-card");

  let bookDetails = document.createElement("div");
  bookDetails.textContent =
    library.booksList[i].title +
    library.booksList[i].author +
    library.booksList[i].pages +
    library.booksList[i].isRead;
  bookCard.appendChild(bookDetails);

  libraryContainer.appendChild(bookCard);
}
