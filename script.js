const library = {
  booksList: [],

  addBook(title, author, pages, readStatus) {
    this.booksList.push({
      id: Date.now(),
      title,
      author,
      pages,
      readStatus,
    });
  },
};

const libraryContainer = document.querySelector(".library-container");

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

const libraryMessageTitle = document.querySelector(".library-message-title");
const libraryMessageText = document.querySelector(".library-message-text");

const libraryHeader = document.querySelector(".library-header");
libraryHeader.appendChild(booksCount);

// Book Card Function Creation:

function createBookCard(book) {
  const bookCard = document.createElement("div");
  bookCard.classList.add("book-card");

  const bookTitle = document.createElement("div");
  bookTitle.classList.add("book-title");
  bookTitle.textContent = book.title;

  const bookAuthor = document.createElement("div");
  bookAuthor.classList.add("book-author");
  bookAuthor.textContent = book.author;

  const bookPages = document.createElement("div");
  bookPages.classList.add("book-pages");
  bookPages.textContent = book.pages;

  const bookStatus = document.createElement("div");
  bookStatus.classList.add("book-status");

  const statusIcon = document.createElement("img");
  statusIcon.classList.add("status-icon");

  const statusText = document.createElement("span");
  statusText.classList.add("status-text");
  statusText.textContent = book.readStatus;

  if (book.readStatus === "Read") {
    statusIcon.src = "images/read-status.svg";
    bookStatus.classList.add("status-read");
  } else {
    statusIcon.src = "images/not-read-status.svg";
    bookStatus.classList.add("status-not-read");
  }

  bookStatus.appendChild(statusIcon);
  bookStatus.appendChild(statusText);

  const topGroup = document.createElement("div");
  topGroup.classList.add("top-group");
  topGroup.appendChild(bookTitle);

  const authorIcon = document.createElement("img");
  authorIcon.classList.add("author-icon");
  authorIcon.src = "images/user.svg";
  authorIcon.alt = "Author icon";

  const authorGroup = document.createElement("div");
  authorGroup.classList.add("author-group");

  authorGroup.appendChild(authorIcon);
  authorGroup.appendChild(bookAuthor);

  topGroup.appendChild(authorGroup);

  const pagesIcon = document.createElement("img");
  pagesIcon.classList.add("pages-icon");
  pagesIcon.src = "images/pages.svg";
  pagesIcon.alt = "Pages icon";

  const pagesGroup = document.createElement("div");
  pagesGroup.classList.add("pages-group");

  pagesGroup.appendChild(pagesIcon);
  pagesGroup.appendChild(bookPages);

  topGroup.appendChild(pagesGroup);

  const bottomGroup = document.createElement("div");
  bottomGroup.classList.add("bottom-group");

  const deleteBtn = document.createElement("button");
  deleteBtn.classList.add("delete-btn");

  const binIcon = document.createElement("img");
  binIcon.classList.add("bin-icon");
  binIcon.src = "images/bin-icon.svg";
  binIcon.alt = "Bin icon";

  deleteBtn.appendChild(binIcon);

  deleteBtn.addEventListener("click", () => {
    bookCard.remove();

    const bookIndex = library.booksList.findIndex(
      (libraryBook) => libraryBook.id === book.id,
    );

    if (bookIndex !== -1) {
      library.booksList.splice(bookIndex, 1);
    }

    updateLibraryInfo();
  });

  bottomGroup.appendChild(bookStatus);
  bottomGroup.appendChild(deleteBtn);

  bookCard.appendChild(topGroup);
  bookCard.appendChild(bottomGroup);

  return bookCard;
}

function updateLibraryInfo() {
  if (library.booksList.length === 1) {
    booksCount.textContent = `${library.booksList.length} Book`;
  } else {
    booksCount.textContent = `${library.booksList.length} Books`;
  }

  if (library.booksList.length === 0) {
    libraryMessageTitle.textContent = "Your library is empty!";
    libraryMessageText.textContent =
      "Add your first book to start building your collection.";
  } else {
    libraryMessageTitle.textContent = "Keep adding to your library!";
    libraryMessageText.textContent =
      "Your collection is growing. Add more books to build your personal library.";
  }
}

const submitBookBtn = document.querySelector(".submit-book-btn");

submitBookBtn.addEventListener("click", (event) => {
  event.preventDefault();

  // 1) get input values
  const titleInput = document.querySelector("#title");
  const title = titleInput.value;

  const authorInput = document.querySelector("#author");
  const author = authorInput.value;

  const pagesInput = document.querySelector("#pages");
  const pages = pagesInput.value;

  const readStatusInput = document.querySelector("#read-status");

  let readStatus;

  if (readStatusInput.checked === true) {
    readStatus = "Read";
  } else {
    readStatus = "Not read";
  }

  // 2) add book to library
  library.addBook(title, author, pages, readStatus);
  const currentBook = library.booksList[library.booksList.length - 1];

  // 3) update count/message
  updateLibraryInfo();

  // 4) create and append card
  const bookCard = createBookCard(currentBook);
  libraryContainer.appendChild(bookCard);

  // 5) close and reset
  modalOverlay.classList.remove("active");
  bookForm.reset();
});
