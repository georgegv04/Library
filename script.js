function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function getStoredBooks() {
  try {
    const storedBooks = JSON.parse(localStorage.getItem("libraryBooks")) || [];

    return storedBooks.map((book) => ({
      ...book,
      dateAdded: book.dateAdded || getTodayDate(),
    }));
  } catch (error) {
    console.error("Could not read saved books:", error);
    return [];
  }
}

const library = {
  booksList: getStoredBooks(),

  addBook(title, author, pages, readStatus, coverUrl) {
    const newBook = {
      id: crypto.randomUUID(),
      title,
      author,
      pages,
      readStatus,
      coverUrl,
      dateAdded: getTodayDate(),
    };

    this.booksList.push(newBook);
    this.saveBooks();

    return newBook;
  },

  updateBook(bookId, updatedValues) {
    const bookIndex = this.booksList.findIndex((book) => book.id === bookId);

    if (bookIndex === -1) {
      return false;
    }

    this.booksList[bookIndex] = {
      ...this.booksList[bookIndex],
      ...updatedValues,
    };

    this.saveBooks();

    return true;
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

const addModalOverlay = document.querySelector(".modal-overlay");
const editModalOverlay = document.querySelector(".edit-modal-overlay");

const addNewBookBtn = document.querySelector(".add-new-book-btn");

const cancelBtn = document.querySelector(".cancel-btn");
const cancelEditBtn = document.querySelector(".cancel-edit-btn");

const closeEditBtn = document.querySelector(".close-edit-btn");

const bookForm = document.querySelector(".book-form");
const editBookForm = document.querySelector(".edit-book-form");

const submitBookBtn = document.querySelector(".submit-book-btn");

const saveEditBtn = document.querySelector(".save-edit-btn");

const libraryMessageTitle = document.querySelector(".library-message-title");

const libraryMessageText = document.querySelector(".library-message-text");

const libraryHeader = document.querySelector(".library-header");

const titleInput = document.querySelector("#title");
const authorInput = document.querySelector("#author");
const pagesInput = document.querySelector("#pages");
const readStatusInput = document.querySelector("#read-status");

const editTitleInput = document.querySelector("#edit-title");

const editAuthorInput = document.querySelector("#edit-author");

const editPagesInput = document.querySelector("#edit-pages");

const editDateAddedInput = document.querySelector("#edit-date-added");

const editReadStatusInput = document.querySelector("#edit-read-status");

let editingBookId = null;

const booksCount = document.createElement("div");
booksCount.classList.add("books-count");
libraryHeader.appendChild(booksCount);

function openAddModal() {
  addModalOverlay.classList.add("active");
  titleInput.focus();
}

function closeAddModal() {
  addModalOverlay.classList.remove("active");
  bookForm.reset();

  submitBookBtn.disabled = false;
  submitBookBtn.textContent = "Add Book";
}

function openEditModal(book) {
  editingBookId = book.id;

  editTitleInput.value = book.title;
  editAuthorInput.value = book.author;
  editPagesInput.value = book.pages;
  editDateAddedInput.value = book.dateAdded || getTodayDate();

  editReadStatusInput.checked = book.readStatus === "Read";

  editModalOverlay.classList.add("active");
  editTitleInput.focus();
}

function closeEditModal() {
  editingBookId = null;

  editModalOverlay.classList.remove("active");
  editBookForm.reset();

  saveEditBtn.disabled = false;
  saveEditBtn.textContent = "Save Changes";
}

addNewBookBtn.addEventListener("click", openAddModal);
cancelBtn.addEventListener("click", closeAddModal);

cancelEditBtn.addEventListener("click", closeEditModal);

closeEditBtn.addEventListener("click", closeEditModal);

addModalOverlay.addEventListener("click", (event) => {
  if (event.target === addModalOverlay) {
    closeAddModal();
  }
});

editModalOverlay.addEventListener("click", (event) => {
  if (event.target === editModalOverlay) {
    closeEditModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  if (addModalOverlay.classList.contains("active")) {
    closeAddModal();
  }

  if (editModalOverlay.classList.contains("active")) {
    closeEditModal();
  }
});

async function getBookCover(title, author) {
  const defaultCover = "images/default-cover.png";

  const searchParams = new URLSearchParams({
    title,
    author,
    limit: "10",
  });

  const searchUrl =
    `https://openlibrary.org/search.json?` + searchParams.toString();

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

    return (
      "https://covers.openlibrary.org/b/id/" + `${matchingBook.cover_i}-L.jpg`
    );
  } catch (error) {
    console.error("Could not retrieve book cover:", error);

    return defaultCover;
  }
}

function createBookCard(book) {
  const bookCard = document.createElement("article");
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

  const bookInformation = document.createElement("div");
  bookInformation.classList.add("book-information");

  const topGroup = document.createElement("div");
  topGroup.classList.add("top-group");

  const bookTitle = document.createElement("div");
  bookTitle.classList.add("book-title");
  bookTitle.textContent = book.title;

  const authorGroup = document.createElement("div");
  authorGroup.classList.add("author-group");

  const authorIcon = document.createElement("img");
  authorIcon.classList.add("author-icon");
  authorIcon.src = "images/user.svg";
  authorIcon.alt = "Author";

  const bookAuthor = document.createElement("div");
  bookAuthor.classList.add("book-author");
  bookAuthor.textContent = book.author;

  authorGroup.appendChild(authorIcon);
  authorGroup.appendChild(bookAuthor);

  const pagesGroup = document.createElement("div");
  pagesGroup.classList.add("pages-group");

  const pagesIcon = document.createElement("img");
  pagesIcon.classList.add("pages-icon");
  pagesIcon.src = "images/pages.svg";
  pagesIcon.alt = "Pages";

  const bookPages = document.createElement("div");
  bookPages.classList.add("book-pages");
  bookPages.textContent = `${book.pages} pages`;

  pagesGroup.appendChild(pagesIcon);
  pagesGroup.appendChild(bookPages);

  topGroup.appendChild(bookTitle);
  topGroup.appendChild(authorGroup);
  topGroup.appendChild(pagesGroup);

  const bottomGroup = document.createElement("div");
  bottomGroup.classList.add("bottom-group");

  const bookStatus = document.createElement("div");
  bookStatus.classList.add("book-status");

  const statusIcon = document.createElement("img");
  statusIcon.classList.add("status-icon");

  const statusText = document.createElement("span");
  statusText.classList.add("status-text");
  statusText.textContent = book.readStatus;

  if (book.readStatus === "Read") {
    statusIcon.src = "images/read-status.svg";
    statusIcon.alt = "Read";
    bookStatus.classList.add("status-read");
  } else {
    statusIcon.src = "images/not-read-status.svg";
    statusIcon.alt = "Not read";
    bookStatus.classList.add("status-not-read");
  }

  bookStatus.appendChild(statusIcon);
  bookStatus.appendChild(statusText);

  const cardActions = document.createElement("div");
  cardActions.classList.add("card-actions");

  const editBtn = document.createElement("button");
  editBtn.classList.add("edit-btn");
  editBtn.type = "button";
  editBtn.setAttribute("aria-label", `Edit ${book.title}`);
  editBtn.title = `Edit ${book.title}`;

  const editIcon = document.createElement("img");
  editIcon.classList.add("edit-icon");
  editIcon.src = "images/pencil.svg";
  editIcon.alt = "";

  editBtn.appendChild(editIcon);

  editBtn.addEventListener("click", () => {
    openEditModal(book);
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.classList.add("delete-btn");
  deleteBtn.type = "button";

  deleteBtn.setAttribute("aria-label", `Delete ${book.title}`);

  const binIcon = document.createElement("img");
  binIcon.classList.add("bin-icon");
  binIcon.src = "images/bin-icon.svg";
  binIcon.alt = "";

  deleteBtn.appendChild(binIcon);

  deleteBtn.addEventListener("click", () => {
    library.removeBook(book.id);
    renderLibrary();
  });

  cardActions.appendChild(editBtn);
  cardActions.appendChild(deleteBtn);

  bottomGroup.appendChild(bookStatus);
  bottomGroup.appendChild(cardActions);

  bookInformation.appendChild(topGroup);
  bookInformation.appendChild(bottomGroup);

  bookMain.appendChild(bookCover);
  bookMain.appendChild(bookInformation);

  bookCard.appendChild(bookMain);

  return bookCard;
}

function updateLibraryInfo() {
  const numberOfBooks = library.booksList.length;

  booksCount.textContent =
    numberOfBooks === 1 ? "1 Book" : `${numberOfBooks} Books`;

  if (numberOfBooks === 0) {
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

  const title = titleInput.value.trim();
  const author = authorInput.value.trim();
  const pages = pagesInput.value.trim();

  if (!title || !author || !pages) {
    return;
  }

  const readStatus = readStatusInput.checked ? "Read" : "Not read";

  submitBookBtn.disabled = true;
  submitBookBtn.textContent = "Finding cover...";

  try {
    const coverUrl = await getBookCover(title, author);

    library.addBook(title, author, pages, readStatus, coverUrl);

    renderLibrary();
    closeAddModal();
  } catch (error) {
    console.error("Could not add book:", error);

    submitBookBtn.disabled = false;
    submitBookBtn.textContent = "Add Book";
  }
});

editBookForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const book = library.booksList.find(
    (currentBook) => currentBook.id === editingBookId,
  );

  if (!book) {
    closeEditModal();
    return;
  }

  const updatedTitle = editTitleInput.value.trim();

  const updatedAuthor = editAuthorInput.value.trim();

  const updatedPages = editPagesInput.value.trim();

  const updatedDateAdded = editDateAddedInput.value;

  const updatedReadStatus = editReadStatusInput.checked ? "Read" : "Not read";

  if (!updatedTitle || !updatedAuthor || !updatedPages || !updatedDateAdded) {
    return;
  }

  const titleChanged = updatedTitle !== book.title;

  const authorChanged = updatedAuthor !== book.author;

  const titleOrAuthorChanged = titleChanged || authorChanged;

  saveEditBtn.disabled = true;

  saveEditBtn.textContent = titleOrAuthorChanged
    ? "Finding cover..."
    : "Saving...";

  try {
    let updatedCoverUrl = book.coverUrl;

    if (titleOrAuthorChanged) {
      updatedCoverUrl = await getBookCover(updatedTitle, updatedAuthor);
    }

    library.updateBook(editingBookId, {
      title: updatedTitle,
      author: updatedAuthor,
      pages: updatedPages,
      readStatus: updatedReadStatus,
      dateAdded: updatedDateAdded,
      coverUrl: updatedCoverUrl,
    });

    renderLibrary();
    closeEditModal();
  } catch (error) {
    console.error("Could not update book:", error);

    saveEditBtn.disabled = false;
    saveEditBtn.textContent = "Save Changes";
  }
});

function renderLibrary() {
  libraryContainer.innerHTML = "";

  library.booksList.forEach((book) => {
    libraryContainer.appendChild(createBookCard(book));
  });

  updateLibraryInfo();
}

library.saveBooks();
renderLibrary();
