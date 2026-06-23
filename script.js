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

// library.addBook(
//   "Ο Άγιος Παϊσιος ο Αγιορείτης",
//   "Άγιος Παϊσιος",
//   "665 pages",
//   "Read",
// );
// library.addBook("Βίος και Λόγοι", "Άγιος Πορφύριος", "600 pages", "Read");
// library.addBook(
//   "The Brothers Karamazov",
//   "Fyodor Dostoevsky",
//   "885 pages",
//   "Not read yet",

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

// Code for hiding and displaying the form
const modalOverlay = document.querySelector(".modal-overlay");
const addNewBookBtn = document.querySelector(".add-new-book-btn");
const cancelBtn = document.querySelector(".cancel-btn");
const bookForm = document.querySelector(".book-form");

addNewBookBtn.addEventListener("click", () => {
  modalOverlay.classList.add("active");
});

cancelBtn.addEventListener("click", () => {
  modalOverlay.classList.remove("active");
});

const booksCount = document.createElement("div");
booksCount.classList.add("books-count");
booksCount.textContent = `${library.booksList.length} Books`;

const libraryHeader = document.querySelector(".library-header");
libraryHeader.appendChild(booksCount);

const submitBookBtn = document.querySelector(".submit-book-btn");
submitBookBtn.addEventListener("click", (event) => {
  event.preventDefault();

  const titleInput = document.querySelector("#title");
  const title = titleInput.value;

  const authorInput = document.querySelector("#author");
  const author = authorInput.value;

  const pagesInput = document.querySelector("#pages");
  const pages = pagesInput.value;

  let readStatusInput = document.querySelector("#read-status");
  let readStatus = readStatusInput.checked;
  if (readStatus === true) {
    readStatus = "Read";
  } else {
    readStatus = "Not read yet";
  }

  library.addBook(title, author, pages, readStatus);

  if (library.booksList.length === 1) {
    booksCount.textContent = `${library.booksList.length} Book`;
  } else {
    booksCount.textContent = `${library.booksList.length} Books`;
  }

  const newBookCard = document.createElement("div");
  newBookCard.classList.add("book-card");

  const newBookTitle = document.createElement("div");
  newBookTitle.classList.add("book-title");
  newBookTitle.textContent = title;

  const newBookAuthor = document.createElement("div");
  newBookAuthor.classList.add("book-author");
  newBookAuthor.textContent = author;

  const newBookPages = document.createElement("div");
  newBookPages.classList.add("book-pages");
  newBookPages.textContent = pages;

  const newBookStatus = document.createElement("div");
  newBookStatus.classList.add("book-status");
  newBookStatus.textContent = readStatus;

  if (readStatus === "Read") {
    newBookStatus.classList.add("status-read");
  } else {
    newBookStatus.classList.add("status-not-read");
  }

  const topGroup = document.createElement("div");
  topGroup.classList.add("top-group");
  topGroup.appendChild(newBookTitle);
  topGroup.appendChild(newBookAuthor);

  newBookCard.appendChild(topGroup);

  const bottomGroup = document.createElement("div");
  bottomGroup.classList.add("bottom-group");
  bottomGroup.appendChild(newBookPages);
  bottomGroup.appendChild(newBookStatus);

  newBookCard.appendChild(bottomGroup);

  libraryContainer.appendChild(newBookCard);

  modalOverlay.classList.remove("active");
  bookForm.reset();

  console.log(library.booksList);
});
