const library = {
  booksList: JSON.parse(localStorage.getItem("libraryBooks")) || [],

  addBook(title, author, pages, readStatus, coverUrl) {
    const newBook = {
      id: crypto.randomUUID(),
      title,
      author,
      pages,
      readStatus,
      coverUrl,
    };

    this.booksList.push(newBook);
    this.saveBooks();

    return newBook;
  },

  removeBook(bookId) {
    this.booksList = this.booksList.filter((book) => book.id !== bookId);
    this.saveBooks();
  },

  saveBooks() {
    localStorage.setItem("libraryBooks", JSON.stringify(this.booksList));
  },
};

const libraryContainer = document.querySelector(".library-container");
const modalOverlay = document.querySelector(".modal-overlay");
const addNewBookBtn = document.querySelector(".add-new-book-btn");
const cancelBtn = document.querySelector(".cancel-btn");
const bookForm = document.querySelector(".book-form");
const libraryMessageTitle = document.querySelector(".library-message-title");
const libraryMessageText = document.querySelector(".library-message-text");
const libraryHeader = document.querySelector(".library-header");
const submitBookBtn = document.querySelector(".submit-book-btn");

const booksCount = document.createElement("div");
booksCount.classList.add("books-count");
booksCount.textContent = `${library.booksList.length} Books`;
libraryHeader.appendChild(booksCount);

addNewBookBtn.addEventListener("click", () => {
  modalOverlay.classList.add("active");
});

cancelBtn.addEventListener("click", () => {
  modalOverlay.classList.remove("active");
});

async function getBookCover(title, author) {
  const defaultCover = "images/default-cover.png";

  const searchParams = new URLSearchParams({
    title: title,
    author: author,
    limit: "10",
  });

  const searchUrl = `https://openlibrary.org/search.json?${searchParams.toString()}`;

  try {
    const response = await fetch(searchUrl);

    if (!response.ok) {
      throw new Error(`Book search failed: ${response.status}`);
    }

    const data = await response.json();

    const matchingBook = data.docs.find((book) => book.cover_i);

    if (!matchingBook) {
      return defaultCover;
    }

    return `https://covers.openlibrary.org/b/id/${matchingBook.cover_i}-L.jpg`;
  } catch (error) {
    console.error("Could not retrieve book cover:", error);
    return defaultCover;
  }
}

// Book Card Function Creation:
function createBookCard(book) {
  const bookCard = document.createElement("div");
  bookCard.classList.add("book-card");

  const bookMain = document.createElement("div");
  bookMain.classList.add("book-main");

  const bookCover = document.createElement("img");
  bookCover.classList.add("book-cover");
  bookCover.src = book.coverUrl || "images/default-cover.png";
  bookCover.alt = `Cover of ${book.title}`;

  bookCover.addEventListener(
    "error",
    () => {
      bookCover.src = "images/default-cover.png";
    },
    { once: true },
  );

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
    library.removeBook(book.id);
    bookCard.remove();
    updateLibraryInfo();
  });

  bottomGroup.appendChild(bookStatus);
  bottomGroup.appendChild(deleteBtn);

  const bookInformation = document.createElement("div");
  bookInformation.classList.add("book-information");

  bookInformation.appendChild(topGroup);
  bookInformation.appendChild(bottomGroup);

  bookMain.appendChild(bookCover);
  bookMain.appendChild(bookInformation);

  bookCard.appendChild(bookMain);

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

bookForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const titleInput = document.querySelector("#title");
  const authorInput = document.querySelector("#author");
  const pagesInput = document.querySelector("#pages");
  const readStatusInput = document.querySelector("#read-status");

  const title = titleInput.value.trim();
  const author = authorInput.value.trim();
  const pages = pagesInput.value.trim();

  if (!title || !author || !pages) {
    return;
  }

  const readStatus = readStatusInput.checked ? "Read" : "Not read";

  submitBookBtn.disabled = true;
  submitBookBtn.textContent = "Finding cover...";

  const coverUrl = await getBookCover(title, author);

  const currentBook = library.addBook(
    title,
    author,
    pages,
    readStatus,
    coverUrl,
  );

  const bookCard = createBookCard(currentBook);
  libraryContainer.appendChild(bookCard);

  updateLibraryInfo();

  modalOverlay.classList.remove("active");
  bookForm.reset();

  submitBookBtn.disabled = false;
  submitBookBtn.textContent = "Add Book";
});

function renderLibrary() {
  libraryContainer.innerHTML = "";

  library.booksList.forEach((book) => {
    const bookCard = createBookCard(book);
    libraryContainer.appendChild(bookCard);
  });

  updateLibraryInfo();
}

renderLibrary();
