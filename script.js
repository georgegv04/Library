function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function getStoredBooks() {
  try {
    const storedBooks = JSON.parse(localStorage.getItem("libraryBooks")) || [];

    return storedBooks.map((book) => ({
      ...book,
      dateAdded: book.dateAdded || getTodayDate(),
      coverUrl:
        book.coverUrl === "images/default-cover.png" ? null : book.coverUrl,
      description: book.descriptionVersion === 2 ? book.description : null,
      rating: Math.min(5, Math.max(0, Number(book.rating) || 0)),
    }));
  } catch (error) {
    console.error("Could not read saved books:", error);
    return [];
  }
}

const library = {
  booksList: [],

  async addBook(title, author, pages, currentPage, readStatus, coverUrl, description = null) {
    const result = await apiRequest("/api/books", {
      method: "POST",
      body: JSON.stringify({ title, author, pages, currentPage, readStatus, coverUrl, description, rating: 0, dateAdded: getTodayDate() }),
    });
    this.booksList.unshift(result.book);
    return result.book;
  },

  async updateBook(bookId, updatedValues) {
    const bookIndex = this.booksList.findIndex((book) => book.id === bookId);

    if (bookIndex === -1) {
      return false;
    }

    const updatedBook = {
      ...this.booksList[bookIndex],
      ...updatedValues,
    };
    const result = await apiRequest(`/api/books/${encodeURIComponent(bookId)}`, {
      method: "PUT",
      body: JSON.stringify(updatedBook),
    });
    this.booksList[bookIndex] = result.book;
    return true;
  },

  async removeBook(bookId) {
    await apiRequest(`/api/books/${encodeURIComponent(bookId)}`, { method: "DELETE" });
    this.booksList = this.booksList.filter((book) => book.id !== bookId);
  },

};

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (response.status === 401) {
    location.href = "/login";
    throw new Error("Please log in to continue.");
  }
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Something went wrong.");
  return result;
}

const libraryContainer = document.querySelector(".library-container");

const addModalOverlay = document.querySelector(".modal-overlay");
const editModalOverlay = document.querySelector(".edit-modal-overlay");
const detailsModalOverlay = document.querySelector(".details-modal-overlay");
const ratingModalOverlay = document.querySelector(".rating-modal-overlay");

const addNewBookBtn = document.querySelector(".add-new-book-btn");
const accountName = document.querySelector(".account-name");
const logoutBtn = document.querySelector(".logout-btn");

const cancelBtn = document.querySelector(".cancel-btn");
const cancelEditBtn = document.querySelector(".cancel-edit-btn");

const closeEditBtn = document.querySelector(".close-edit-btn");
const closeDetailsBtn = document.querySelector(".close-details-btn");
const closeRatingBtn = document.querySelector(".close-rating-btn");

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
const currentPageInput = document.querySelector("#current-page");
const readStatusInputs = document.querySelectorAll('input[name="read-status"]');

const editTitleInput = document.querySelector("#edit-title");

const editAuthorInput = document.querySelector("#edit-author");

const editPagesInput = document.querySelector("#edit-pages");
const editCurrentPageInput = document.querySelector("#edit-current-page");

const editRatingInput = document.querySelector("#edit-rating");

const editReadStatusInput = document.querySelector("#edit-read-status");

const detailsCover = document.querySelector(".details-cover");
const detailsTitle = document.querySelector(".details-title");
const detailsAuthor = document.querySelector(".details-author");
const detailsPages = document.querySelector(".details-pages");
const detailsStatus = document.querySelector(".details-status");
const detailsProgressText = document.querySelector(".details-progress-text");
const detailsProgressFill = document.querySelector(".details-progress-fill");
const detailsDate = document.querySelector(".details-date");
const detailsDescription = document.querySelector(".details-description");
const detailsRatingDisplay = document.querySelector(
  ".details-rating-display",
);
const detailsRatingStars = document.querySelectorAll(
  ".details-rating-display span",
);
const quickRatingTitle = document.querySelector(".rating-modal-title");
const quickRatingButtons = document.querySelectorAll(
  ".quick-rating-control button",
);

let editingBookId = null;
let viewingBookId = null;
let ratingBookId = null;

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
  editCurrentPageInput.value = book.currentPage || 0;
  editCurrentPageInput.max = String(book.pages);
  editRatingInput.value = String(book.rating || 0);

  editReadStatusInput.value = book.readStatus;
  editRatingInput.disabled = book.readStatus === "Want to read";

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

function getFallbackDescription(book) {
  const readingNotes = {
    "Want to read": "It is waiting on your reading list.",
    "Currently reading": "You are currently reading it.",
    Finished: "You have finished reading it.",
  };
  const readingNote = readingNotes[book.readStatus] || readingNotes["Want to read"];

  return `${book.title} is a ${book.pages}-page work by ${book.author}. ${readingNote}`;
}

function formatBookDate(date) {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(`${date || getTodayDate()}T00:00:00`));
}

function getReadingProgress(book) {
  const totalPages = Math.max(1, Number(book.pages) || 1);
  const currentPage = Math.min(totalPages, Math.max(0, Number(book.currentPage) || 0));
  return {
    currentPage,
    percentage: Math.round((currentPage / totalPages) * 100),
  };
}

function updateRatingDisplay(rating, readStatus) {
  const ratingLocked = readStatus === "Want to read";
  detailsRatingStars.forEach((star, index) => {
    star.classList.toggle("selected", !ratingLocked && index < rating);
  });

  detailsRatingDisplay.classList.toggle("rating-locked", ratingLocked);
  detailsRatingDisplay.setAttribute(
    "aria-label",
    ratingLocked ? "Read this book before rating it" : rating ? `${rating} out of 5 stars` : "Not rated",
  );
}

function updateQuickRatingDisplay(rating) {
  quickRatingButtons.forEach((button) => {
    const buttonRating = Number(button.dataset.rating);

    button.classList.toggle("selected", buttonRating <= rating);
    button.setAttribute("aria-pressed", String(buttonRating === rating));
  });
}

function openRatingModal(book) {
  ratingBookId = book.id;
  quickRatingTitle.textContent = book.title;
  updateQuickRatingDisplay(book.rating || 0);

  ratingModalOverlay.classList.add("active");
  closeRatingBtn.focus();
}

function closeRatingModal() {
  ratingBookId = null;
  ratingModalOverlay.classList.remove("active");
}

async function openDetailsModal(book) {
  viewingBookId = book.id;

  detailsCover.src =
    book.coverUrl || createPersonalizedCover(book.title, book.author);
  detailsCover.alt = `Cover of ${book.title}`;
  detailsCover.onerror = () => {
    detailsCover.onerror = null;
    detailsCover.src = createPersonalizedCover(book.title, book.author);
  };
  detailsTitle.textContent = book.title;
  detailsAuthor.textContent = `by ${book.author}`;
  detailsPages.textContent = `${book.pages} pages`;
  detailsStatus.textContent = book.readStatus;
  const progress = getReadingProgress(book);
  detailsProgressText.textContent = `${progress.currentPage} of ${book.pages} pages · ${progress.percentage}%`;
  detailsProgressFill.style.width = `${progress.percentage}%`;
  detailsDate.textContent = formatBookDate(book.dateAdded);
  updateRatingDisplay(book.rating || 0, book.readStatus);
  detailsDescription.textContent =
    book.description || "Finding a short description…";

  detailsModalOverlay.classList.add("active");
  closeDetailsBtn.focus();

  if (book.description) {
    return;
  }

  const description = await getBookDescription(book.title, book.author);
  const finalDescription = description || getFallbackDescription(book);

  await library.updateBook(book.id, {
    description: finalDescription,
    descriptionVersion: 2,
  });

  if (viewingBookId === book.id) {
    detailsDescription.textContent = finalDescription;
  }
}

function closeDetailsModal() {
  viewingBookId = null;
  detailsModalOverlay.classList.remove("active");
}

addNewBookBtn.addEventListener("click", openAddModal);
cancelBtn.addEventListener("click", closeAddModal);

cancelEditBtn.addEventListener("click", closeEditModal);

pagesInput.addEventListener("input", () => {
  currentPageInput.max = pagesInput.value;
});

editPagesInput.addEventListener("input", () => {
  editCurrentPageInput.max = editPagesInput.value;
});

readStatusInputs.forEach((input) => {
  input.addEventListener("change", () => {
    if (input.checked && input.value === "Want to read") {
      currentPageInput.value = "0";
    } else if (input.checked && input.value === "Finished" && pagesInput.value) {
      currentPageInput.value = pagesInput.value;
    }
  });
});

editReadStatusInput.addEventListener("change", () => {
  editRatingInput.disabled = editReadStatusInput.value === "Want to read";
  if (editReadStatusInput.value === "Want to read") {
    editCurrentPageInput.value = "0";
  } else if (editReadStatusInput.value === "Finished" && editPagesInput.value) {
    editCurrentPageInput.value = editPagesInput.value;
  }
});

closeEditBtn.addEventListener("click", closeEditModal);
closeDetailsBtn.addEventListener("click", closeDetailsModal);
closeRatingBtn.addEventListener("click", closeRatingModal);

quickRatingButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const book = library.booksList.find(
      (currentBook) => currentBook.id === ratingBookId,
    );

    if (!book) {
      return;
    }

    const rating = Number(button.dataset.rating);

    await library.updateBook(book.id, { rating });
    renderLibrary();
    closeRatingModal();
  });
});

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

detailsModalOverlay.addEventListener("click", (event) => {
  if (event.target === detailsModalOverlay) {
    closeDetailsModal();
  }
});

ratingModalOverlay.addEventListener("click", (event) => {
  if (event.target === ratingModalOverlay) {
    closeRatingModal();
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

  if (detailsModalOverlay.classList.contains("active")) {
    closeDetailsModal();
  }

  if (ratingModalOverlay.classList.contains("active")) {
    closeRatingModal();
  }

});

function normalizeBookText(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function escapeSvgText(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function wrapCoverText(value, maximumLineLength, maximumLines) {
  const words = value.trim().split(/\s+/);
  const lines = [];

  words.forEach((word) => {
    const currentLine = lines[lines.length - 1];

    if (
      !currentLine ||
      `${currentLine} ${word}`.length > maximumLineLength
    ) {
      if (lines.length < maximumLines) {
        lines.push(word);
      }
    } else {
      lines[lines.length - 1] = `${currentLine} ${word}`;
    }
  });

  if (words.join(" ").length > lines.join(" ").length && lines.length) {
    lines[lines.length - 1] = `${lines[lines.length - 1].slice(0, -1)}…`;
  }

  return lines.map(escapeSvgText);
}

function createPersonalizedCover(title, author) {
  const palettes = [
    ["#102a2e", "#d7b56d"],
    ["#1b2945", "#d8b46a"],
    ["#3d2030", "#e2c17d"],
    ["#26351f", "#d9bd78"],
  ];
  const paletteIndex = [...`${title}${author}`].reduce(
    (total, character) => total + character.codePointAt(0),
    0,
  );
  const [background, accent] = palettes[paletteIndex % palettes.length];
  const titleLines = wrapCoverText(title, 17, 4);
  const authorLines = wrapCoverText(author, 24, 2);
  const titleMarkup = titleLines
    .map(
      (line, index) =>
        `<text x="200" y="${220 + index * 54}" class="title">${line}</text>`,
    )
    .join("");
  const authorMarkup = authorLines
    .map(
      (line, index) =>
        `<text x="200" y="${520 + index * 30}" class="author">${line}</text>`,
    )
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">
    <rect width="400" height="600" rx="8" fill="${background}"/>
    <rect x="22" y="22" width="356" height="556" rx="4" fill="none" stroke="${accent}" stroke-width="3"/>
    <rect x="32" y="32" width="336" height="536" rx="2" fill="none" stroke="${accent}" stroke-width="1" opacity=".65"/>
    <path d="M110 122h180M142 106h116M142 138h116" stroke="${accent}" stroke-width="2" opacity=".85"/>
    <circle cx="200" cy="122" r="7" fill="${accent}"/>
    <g fill="${accent}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif">
      ${titleMarkup}
      <path d="M128 463h144" stroke="${accent}" stroke-width="2"/>
      <circle cx="200" cy="463" r="5" fill="${accent}"/>
      ${authorMarkup}
    </g>
    <style>.title{font-size:34px;font-weight:700}.author{font-size:18px;letter-spacing:1px}</style>
  </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getBookMatchScore(resultTitle, resultAuthors, title, author) {
  const wantedTitle = normalizeBookText(title);
  const wantedAuthor = normalizeBookText(author);
  const foundTitle = normalizeBookText(resultTitle);
  const foundAuthors = normalizeBookText(
    Array.isArray(resultAuthors) ? resultAuthors.join(" ") : resultAuthors,
  );

  if (!foundTitle) {
    return 0;
  }

  let score = 0;

  if (foundTitle === wantedTitle) {
    score += 6;
  } else if (
    foundTitle.includes(wantedTitle) ||
    wantedTitle.includes(foundTitle)
  ) {
    score += 4;
  } else {
    const titleWords = wantedTitle.split(" ").filter((word) => word.length > 2);
    const matchingWords = titleWords.filter((word) => foundTitle.includes(word));
    score += titleWords.length
      ? (matchingWords.length / titleWords.length) * 3
      : 0;
  }

  if (
    wantedAuthor &&
    foundAuthors &&
    (foundAuthors === wantedAuthor ||
      foundAuthors.includes(wantedAuthor) ||
      wantedAuthor.includes(foundAuthors))
  ) {
    score += 3;
  }

  return score;
}

function getGoogleCoverUrl(imageLinks = {}) {
  const coverUrl =
    imageLinks.extraLarge ||
    imageLinks.large ||
    imageLinks.medium ||
    imageLinks.small ||
    imageLinks.thumbnail ||
    imageLinks.smallThumbnail;

  return coverUrl?.replace(/^http:/, "https:") || null;
}

async function fetchBookData(url, timeout = 7000) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });

    return response;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function shortenDescription(description, maximumLength = 280) {
  const documentFragment = new DOMParser().parseFromString(
    description || "",
    "text/html",
  );
  const plainDescription = documentFragment.body.textContent
    .replace(/\s+/g, " ")
    .trim();

  if (plainDescription.length <= maximumLength) {
    return plainDescription;
  }

  const shortenedDescription = plainDescription.slice(0, maximumLength);
  const lastSentence = shortenedDescription.lastIndexOf(". ");
  const lastSpace = shortenedDescription.lastIndexOf(" ");
  const endIndex = lastSentence > maximumLength * 0.55
    ? lastSentence + 1
    : lastSpace;

  return `${shortenedDescription.slice(0, endIndex).trim()}…`;
}

function getCuratedDescription(title) {
  const descriptions = {
    "the brothers karamazov":
      "The Brothers Karamazov is a passionate philosophical novel and murder mystery about faith, doubt, free will, and a deeply divided family. It follows an abusive father and his sons as rivalry, guilt, and spiritual questions gather around his death.",
    "pride and prejudice":
      "Pride and Prejudice is Jane Austen’s classic romantic novel about Elizabeth Bennet and Fitzwilliam Darcy. Their sharp first impressions, pride, and misunderstandings must give way to self-knowledge before they can recognize their love for one another.",
    "βιος και λογοι":
      "Το «Βίος και Λόγοι» είναι πνευματικό έργο για τη ζωή και τη διδασκαλία του Αγίου Πορφυρίου του Καυσοκαλυβίτη. Συνδυάζει τη βιογραφία του Αγίου με λόγους του για την αγάπη στον Χριστό, την προσευχή, την οικογένεια και την καθημερινή πνευματική ζωή.",
  };

  return descriptions[normalizeBookText(title)] || null;
}

async function searchWikipediaDescription(title, author) {
  const containsGreek = /[\u0370-\u03ff\u1f00-\u1fff]/u.test(
    `${title}${author}`,
  );
  const languages = containsGreek ? ["el", "en"] : ["en"];

  for (const language of languages) {
    try {
      const searchParams = new URLSearchParams({
        q: `${title} ${author}`,
        limit: "5",
      });
      const searchResponse = await fetchBookData(
        `https://${language}.wikipedia.org/w/rest.php/v1/search/page?${searchParams}`,
      );

      if (!searchResponse.ok) {
        continue;
      }

      const searchData = await searchResponse.json();
      const candidates = (searchData.pages || [])
        .map((page) => ({
          key: page.key,
          score: getBookMatchScore(
            page.title,
            page.description,
            title,
            author,
          ),
        }))
        .filter((candidate) => candidate.key && candidate.score >= 4)
        .sort((first, second) => second.score - first.score);

      if (!candidates.length) {
        continue;
      }

      const summaryResponse = await fetchBookData(
        `https://${language}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(candidates[0].key)}`,
      );

      if (!summaryResponse.ok) {
        continue;
      }

      const summaryData = await summaryResponse.json();

      if (summaryData.extract) {
        return shortenDescription(summaryData.extract);
      }
    } catch (error) {
      console.warn("Wikipedia description search failed:", error);
    }
  }

  return null;
}

async function searchGoogleDescription(title, author) {
  const queries = [
    `intitle:"${title}" inauthor:"${author}"`,
    `intitle:"${title}"`,
    `${title} ${author}`,
  ];

  for (const query of queries) {
    try {
      const searchParams = new URLSearchParams({
        q: query,
        maxResults: "20",
        printType: "books",
      });
      const response = await fetchBookData(
        `https://www.googleapis.com/books/v1/volumes?${searchParams}`,
      );

      if (response.status === 429) {
        return null;
      }

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const candidates = (data.items || [])
        .map(({ volumeInfo = {} }) => ({
          description: volumeInfo.description,
          score: getBookMatchScore(
            volumeInfo.title,
            volumeInfo.authors,
            title,
            author,
          ),
        }))
        .filter(
          (candidate) => candidate.description && candidate.score >= 4,
        )
        .sort((first, second) => second.score - first.score);

      if (candidates.length) {
        return shortenDescription(candidates[0].description);
      }
    } catch (error) {
      console.warn("Google Books description search failed:", error);
    }
  }

  return null;
}

async function searchOpenLibraryDescription(title, author) {
  const searches = [
    { title, author },
    { q: `${title} ${author}` },
    { title },
  ];

  for (const search of searches) {
    try {
      const searchParams = new URLSearchParams({
        ...search,
        fields: "title,author_name,first_sentence",
        limit: "20",
      });
      const response = await fetchBookData(
        `https://openlibrary.org/search.json?${searchParams}`,
      );

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const candidates = (data.docs || [])
        .map((book) => ({
          description: Array.isArray(book.first_sentence)
            ? book.first_sentence[0]
            : book.first_sentence,
          score: getBookMatchScore(book.title, book.author_name, title, author),
        }))
        .filter(
          (candidate) => candidate.description && candidate.score >= 4,
        )
        .sort((first, second) => second.score - first.score);

      if (candidates.length) {
        return shortenDescription(candidates[0].description);
      }
    } catch (error) {
      console.warn("Open Library description search failed:", error);
    }
  }

  return null;
}

async function getBookDescription(title, author) {
  const curatedDescription = getCuratedDescription(title);

  if (curatedDescription) {
    return curatedDescription;
  }

  const wikipediaDescription = await searchWikipediaDescription(title, author);

  if (wikipediaDescription) {
    return wikipediaDescription;
  }

  const [googleDescription, openLibraryDescription] = await Promise.all([
    searchGoogleDescription(title, author),
    searchOpenLibraryDescription(title, author),
  ]);

  return googleDescription || openLibraryDescription;
}

async function searchGoogleBooks(title, author) {
  const queries = [
    `intitle:"${title}" inauthor:"${author}"`,
    `intitle:"${title}"`,
    `${title} ${author}`,
  ];

  for (const query of queries) {
    try {
      const searchParams = new URLSearchParams({
        q: query,
        maxResults: "20",
        printType: "books",
      });
      const response = await fetchBookData(
        `https://www.googleapis.com/books/v1/volumes?${searchParams}`,
      );

      if (response.status === 429) {
        return null;
      }

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const candidates = (data.items || [])
        .map(({ volumeInfo = {} }) => ({
          coverUrl: getGoogleCoverUrl(volumeInfo.imageLinks),
          score: getBookMatchScore(
            volumeInfo.title,
            volumeInfo.authors,
            title,
            author,
          ),
        }))
        .filter((candidate) => candidate.coverUrl && candidate.score >= 4)
        .sort((first, second) => second.score - first.score);

      if (candidates.length) {
        return candidates[0].coverUrl;
      }
    } catch (error) {
      console.warn("Google Books cover search failed:", error);
    }
  }

  return null;
}

async function searchOpenLibrary(title, author) {
  const searches = [
    { title, author },
    { q: `${title} ${author}` },
    { title },
  ];

  for (const search of searches) {
    try {
      const searchParams = new URLSearchParams({
        ...search,
        fields: "title,author_name,cover_i",
        limit: "20",
      });
      const response = await fetchBookData(
        `https://openlibrary.org/search.json?${searchParams}`,
      );

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const candidates = (data.docs || [])
        .filter((book) => book.cover_i)
        .map((book) => ({
          coverUrl: `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`,
          score: getBookMatchScore(book.title, book.author_name, title, author),
        }))
        .filter((candidate) => candidate.score >= 4)
        .sort((first, second) => second.score - first.score);

      if (candidates.length) {
        return candidates[0].coverUrl;
      }
    } catch (error) {
      console.warn("Open Library cover search failed:", error);
    }
  }

  return null;
}

async function getBookCover(
  title,
  author,
  fallbackCover = null,
) {
  const [googleCover, openLibraryCover] = await Promise.all([
    searchGoogleBooks(title, author),
    searchOpenLibrary(title, author),
  ]);

  return (
    googleCover ||
    openLibraryCover ||
    fallbackCover ||
    createPersonalizedCover(title, author)
  );
}

function createBookCard(book) {
  const bookCard = document.createElement("article");
  bookCard.classList.add("book-card");

  const bookMain = document.createElement("div");
  bookMain.classList.add("book-main");

  const bookCover = document.createElement("img");
  bookCover.classList.add("book-cover");
  bookCover.src = book.coverUrl || createPersonalizedCover(book.title, book.author);
  bookCover.alt = `Cover of ${book.title}`;

  bookCover.addEventListener(
    "error",
    () => {
      bookCover.src = createPersonalizedCover(book.title, book.author);
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

  const progress = getReadingProgress(book);
  const progressGroup = document.createElement("div");
  progressGroup.className = "book-progress";
  progressGroup.setAttribute("aria-label", `${progress.percentage}% read`);
  const progressHeader = document.createElement("div");
  progressHeader.className = "book-progress-header";
  const progressLabel = document.createElement("span");
  progressLabel.textContent = "Reading progress";
  const progressValue = document.createElement("span");
  progressValue.textContent = `${progress.currentPage} / ${book.pages} · ${progress.percentage}%`;
  progressHeader.append(progressLabel, progressValue);
  const progressTrack = document.createElement("div");
  progressTrack.className = "book-progress-track";
  const progressFill = document.createElement("div");
  progressFill.className = "book-progress-fill";
  progressFill.style.width = `${progress.percentage}%`;
  progressTrack.appendChild(progressFill);
  progressGroup.append(progressHeader, progressTrack);
  topGroup.appendChild(progressGroup);

  const bottomGroup = document.createElement("div");
  bottomGroup.classList.add("bottom-group");

  const bookStatus = document.createElement("div");
  bookStatus.classList.add("book-status");

  const statusIcon = document.createElement("img");
  statusIcon.classList.add("status-icon");

  const statusText = document.createElement("span");
  statusText.classList.add("status-text");
  statusText.textContent = book.readStatus;

  const statusPresentation = {
    "Want to read": { icon: "images/not-read-status.svg", className: "status-want" },
    "Currently reading": { icon: "images/open-book1.svg", className: "status-reading" },
    Finished: { icon: "images/read-status.svg", className: "status-finished" },
  };
  const presentation = statusPresentation[book.readStatus] || statusPresentation["Want to read"];
  statusIcon.src = presentation.icon;
  statusIcon.alt = "";
  bookStatus.classList.add(presentation.className);

  bookStatus.appendChild(statusIcon);
  bookStatus.appendChild(statusText);

  const ratingBadge = document.createElement("button");
  ratingBadge.classList.add("rating-badge");
  ratingBadge.type = "button";
  const ratingLocked = book.readStatus === "Want to read";
  ratingBadge.disabled = ratingLocked;
  ratingBadge.textContent = ratingLocked
    ? "Read to rate"
    : book.rating
      ? `★ ${book.rating}/5`
      : "☆ Rate";
  ratingBadge.setAttribute(
    "aria-label",
    ratingLocked
      ? `Start reading ${book.title} before rating it`
      : book.rating
      ? `Rated ${book.rating} out of 5. Change rating for ${book.title}`
      : `Rate ${book.title}`,
  );

  ratingBadge.addEventListener("click", () => {
    openRatingModal(book);
  });

  const cardActions = document.createElement("div");
  cardActions.classList.add("card-actions");

  const detailsBtn = document.createElement("button");
  detailsBtn.classList.add("details-btn");
  detailsBtn.type = "button";
  detailsBtn.setAttribute("aria-label", `View details for ${book.title}`);

  const detailsIcon = document.createElement("img");
  detailsIcon.classList.add("details-icon");
  detailsIcon.src = "images/eye.svg";
  detailsIcon.alt = "";

  const detailsText = document.createElement("span");
  detailsText.textContent = "View Details";

  detailsBtn.appendChild(detailsIcon);
  detailsBtn.appendChild(detailsText);

  detailsBtn.addEventListener("click", () => {
    openDetailsModal(book);
  });

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

  deleteBtn.addEventListener("click", async () => {
    await library.removeBook(book.id);
    renderLibrary();
  });

  cardActions.appendChild(detailsBtn);
  cardActions.appendChild(editBtn);
  cardActions.appendChild(deleteBtn);

  bottomGroup.appendChild(bookStatus);
  bottomGroup.appendChild(ratingBadge);

  bookInformation.appendChild(topGroup);
  bookInformation.appendChild(bottomGroup);

  bookMain.appendChild(bookCover);
  bookMain.appendChild(bookInformation);

  bookCard.appendChild(bookMain);
  bookCard.appendChild(cardActions);

  return bookCard;
}

function updateLibraryInfo(numberOfBooks = library.booksList.length) {
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
  const currentPage = currentPageInput.value.trim() || "0";

  if (!title || !author || !pages) {
    return;
  }

  const readStatus = [...readStatusInputs].find((input) => input.checked)?.value || "Want to read";

  submitBookBtn.disabled = true;
  submitBookBtn.textContent = "Finding cover...";

  try {
    const coverUrl = await getBookCover(title, author);

    await library.addBook(title, author, pages, currentPage, readStatus, coverUrl);

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
  const updatedCurrentPage = editCurrentPageInput.value.trim() || "0";

  const updatedRating = Number(editRatingInput.value);

  const updatedReadStatus = editReadStatusInput.value;

  if (!updatedTitle || !updatedAuthor || !updatedPages) {
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

    if (
      titleOrAuthorChanged ||
      !book.coverUrl ||
      book.coverUrl === "images/default-cover.png"
    ) {
      updatedCoverUrl = await getBookCover(
        updatedTitle,
        updatedAuthor,
        book.coverUrl === "images/default-cover.png" ? null : book.coverUrl,
      );
    }

    await library.updateBook(editingBookId, {
      title: updatedTitle,
      author: updatedAuthor,
      pages: updatedPages,
      currentPage: updatedCurrentPage,
      readStatus: updatedReadStatus,
      dateAdded: book.dateAdded || getTodayDate(),
      rating: updatedRating,
      coverUrl: updatedCoverUrl,
      description: titleOrAuthorChanged ? null : book.description,
      descriptionVersion: titleOrAuthorChanged
        ? null
        : book.descriptionVersion,
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

async function importLocalBooks(userId) {
  const migrationKey = `libraryBooksImported:${userId}`;
  if (localStorage.getItem(migrationKey)) return;
  const localBooks = getStoredBooks();
  if (localBooks.length) {
    await Promise.all(localBooks.map((book) => apiRequest("/api/books", {
      method: "POST",
      body: JSON.stringify(book),
    })));
    localStorage.removeItem("libraryBooks");
  }
  localStorage.setItem(migrationKey, "true");
}

logoutBtn.addEventListener("click", async () => {
  logoutBtn.disabled = true;
  await apiRequest("/api/auth/logout", { method: "POST" });
  location.href = "/login?logged-out=1";
});

async function initializeLibrary() {
  try {
    const { user } = await apiRequest("/api/auth/me");
    accountName.textContent = user.name;
    await importLocalBooks(user.id);
    const result = await apiRequest("/api/books");
    library.booksList = result.books;
    renderLibrary();
  } catch (error) {
    console.error("Could not load your library:", error);
  }
}

initializeLibrary();
