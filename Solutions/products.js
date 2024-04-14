async function fetchProducts() {
  const res = await fetch("https://products-dasw.onrender.com/api/products", {
    method: "GET",
    headers: { "x-expediente": 744661 },
  });

  const products = await res.json();

  return products;
}

function renderProducts(page = 0, searchFilter = "") {
  let products = JSON.parse(sessionStorage.getItem("products"));

  if (searchFilter) {
    products = products.filter((product) =>
      product.name.toLowerCase().includes(searchFilter.toLowerCase())
    );
  }

  const pageSize = 4;
  const start = page * pageSize;
  const end = start + pageSize;

  products = products.slice(start, end);

  const html = products.map((product) => toCardComponent(product)).join("\n");

  render("products-row", html);
}

function searchHandler(event) {
  const searchFilter = event.target.value.trim();
  renderProducts(0, searchFilter);
}

const searchInput = document.querySelector(".form-control");
searchInput.addEventListener("input", searchHandler);

fetchProducts().then((products) => {
  sessionStorage.setItem("products", JSON.stringify(products));
  renderProducts();
});

function toCardComponent(obj, hideProps = []) {
  return `
    <div class="col-sm-3 mb-4">
      <div class="card h-100" id="${obj.uuid}">
        <img class="card-img-top w-100" src="${
          hideProps.includes("imageURL") ? "" : obj.imageUrl
        }" alt="${obj.name}">
        <div class="card-body">
          <h3 class="card-title">${
            hideProps.includes("name") ? "" : obj.name
          }</h3>
          <p class="card-text">${
            hideProps.includes("description") ? "" : obj.description
          }</p>
        </div>
        <div class="card-footer">
          <button class="btn btn-primary add-to-cart-btn w-100" data-product-id="${
            obj.uuid
          }">
            <i class="bi bi-cart-fill"></i> Add to Cart
          </button>
        </div>
      </div>
    </div>
  `;
}

function render(id, html) {
  document.querySelector(`#${id}`).innerHTML = html;
}

const pagination = document.getElementById("product-pagination");

fetchProducts().then((products) => {
  const totalPages = Math.ceil(products.length / 4);
  pagination.innerHTML = "";
  for (let i = 0; i < totalPages; i++) {
    const pageButton = document.createElement("li");
    pageButton.classList.add("page-item");
    pageButton.innerHTML = `<a class="page-link" href="#" data-page="${i}">${
      i + 1
    }</a>`;
    pagination.appendChild(pageButton);
  }
});

renderProducts();

pagination.addEventListener("click", (e) => {
  e.preventDefault();

  const target = e.target;
  if (target !== e.currentTarget) {
    const page = parseInt(target.dataset.page);
    renderProducts(page);
  }
});

function showAddModal(productId) {
  $("#cartModal").modal("show");
  $("#productId").val(productId);
}

let globalProductId;

$(document).on("click", ".add-to-cart-btn", function () {
  globalProductId = $(this).data("product-id");
  showAddModal(globalProductId);
});

let userEmail;

document
  .getElementById("loginForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    userEmail = document.getElementById("email").value;
    sessionStorage.setItem("user", userEmail);
    $("#loginModal").modal("hide");
  });

$(document).on("click", "#addToCartBtn", function () {
  const quantity = parseInt($("#quantity").val());
  const productId = globalProductId;
  const user = sessionStorage.getItem("user");

  fetch(`https://products-dasw.onrender.com/api/cart/${productId}`, {
    method: "POST",
    headers: {
      "x-expediente": "744661",
      "x-user": userEmail,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount: quantity }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to add product to cart");
      }
      $("#cartModal").modal("hide");
      Swal.fire({
        icon: "success",
        title: "Success!",
        text: `${quantity} products have been added to the cart.`,
        showConfirmButton: false,
        timer: 1500,
      });
    })
    .catch((error) => {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to add product to cart. Please try again later.",
      });
    });
});

$(document).on("click", "#cartModal .close", function () {
  $("#cartModal").modal("hide");
});

$(document).on("click", '#cartModal [data-dismiss="modal"]', function () {
  $("#cartModal").modal("hide");
});
