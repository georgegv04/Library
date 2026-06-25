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

// For Loop is only for DISPLAYING DEFAULT BOOKS:

// for (let i = 0; i < library.booksList.length; i++) {
//   let bookCard = document.createElement("div");
//   bookCard.classList.add("book-card");

//   let topGroup = document.createElement("div");
//   topGroup.classList.add("top-group");

//   let bookTitle = document.createElement("div");
//   bookTitle.classList.add("book-title");
//   bookTitle.textContent = library.booksList[i].title;
//   topGroup.appendChild(bookTitle);

//   let authorGroup = document.createElement("div");
//   authorGroup.classList.add("author-group");
//   topGroup.appendChild(authorGroup);

// let authorIcon = document.createElement("img");
// authorIcon.classList.add("author-icon");
// authorIcon.src = "images/user.svg";
// authorIcon.alt = "Author icon";
// authorGroup.appendChild(authorIcon);

//   let bookAuthor = document.createElement("div");
//   bookAuthor.classList.add("book-author");
//   bookAuthor.textContent = library.booksList[i].author;
//   authorGroup.appendChild(bookAuthor);

//   let bottomGroup = document.createElement("div");
//   bottomGroup.classList.add("bottom-group");

//   let bookPages = document.createElement("div");
//   bookPages.classList.add("book-pages");
//   bookPages.textContent = library.booksList[i].pages;
//   bottomGroup.appendChild(bookPages);

//   let bookStatus = document.createElement("div");
//   bookStatus.classList.add("book-status");
//   bookStatus.textContent = library.booksList[i].readStatus;

//   if (library.booksList[i].readStatus === "Read") {
//     bookStatus.classList.add("status-read");
//   } else {
//     bookStatus.classList.add("status-not-read");
//   }
//   bottomGroup.appendChild(bookStatus);

//   bookCard.appendChild(topGroup);
//   bookCard.appendChild(bottomGroup);

//   libraryContainer.appendChild(bookCard);
// }

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

const libraryMessageTitle = document.querySelector(".library-message-title");
const libraryMessageText = document.querySelector(".library-message-text");

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
    readStatus = "Not read";
  }

  library.addBook(title, author, pages, readStatus);
  const currentBook = library.booksList[library.booksList.length - 1];

  if (library.booksList.length === 1) {
    booksCount.textContent = `${library.booksList.length} Book`;
  } else {
    booksCount.textContent = `${library.booksList.length} Books`;
  }

  if (library.booksList.length > 0) {
    libraryMessageTitle.textContent = "Keep adding to your library!";
    libraryMessageText.textContent =
      "Your collection is growing. Add more books to build your personal library.";
  }

  const bookCard = document.createElement("div");
  bookCard.classList.add("book-card");

  const bookTitle = document.createElement("div");
  bookTitle.classList.add("book-title");
  bookTitle.textContent = title;

  const bookAuthor = document.createElement("div");
  bookAuthor.classList.add("book-author");
  bookAuthor.textContent = author;

  const bookPages = document.createElement("div");
  bookPages.classList.add("book-pages");
  bookPages.textContent = pages;

  const bookStatus = document.createElement("div");
  bookStatus.classList.add("book-status");

  const statusIcon = document.createElement("img");
  statusIcon.classList.add("status-icon");

  const statusText = document.createElement("span");
  statusText.classList.add("status-text");
  statusText.textContent = readStatus;

  if (readStatus === "Read") {
    statusIcon.src = "images/read-status.svg";
  } else {
    statusIcon.src = "images/not-read-status.svg";
  }

  bookStatus.appendChild(statusIcon);
  bookStatus.appendChild(statusText);

  if (readStatus === "Read") {
    bookStatus.classList.add("status-read");
  } else {
    bookStatus.classList.add("status-not-read");
  }

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

  const bottomGroup = document.createElement("div");
  bottomGroup.classList.add("bottom-group");

  const pagesIcon = document.createElement("img");
  pagesIcon.classList.add("pages-icon");
  pagesIcon.src = "images/pages.svg";
  pagesIcon.alt = "Pages icon";

  const pagesGroup = document.createElement("div");
  pagesGroup.classList.add("pages-group");

  pagesGroup.appendChild(pagesIcon);
  pagesGroup.appendChild(bookPages);

  topGroup.appendChild(pagesGroup);

  bottomGroup.appendChild(bookStatus);

  const actionsGroup = document.createElement("div");
  actionsGroup.classList.add("actions-group");

  const binIcon = document.createElement("img");
  binIcon.classList.add("bin-icon");
  binIcon.src = "images/bin-icon.svg";
  binIcon.alt = "Bin icon";

  // Create Bin Listener to remove the card:
  binIcon.addEventListener("click", () => {
    bookCard.remove();
    library.booksList.splice(currentBook, 1);

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
      libraryMessageTitle.textContent =
        "Your collection is growing. Add more books to build your personal library.";
    }
  });

  actionsGroup.appendChild(binIcon);

  bottomGroup.appendChild(actionsGroup);

  bookCard.appendChild(topGroup);
  bookCard.appendChild(bottomGroup);

  libraryContainer.appendChild(bookCard);

  modalOverlay.classList.remove("active");
  bookForm.reset();
});

const binIcon = document.querySelector(".bin-icon");
