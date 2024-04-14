function renderCart() {
  fetchCart().then((cart) => {
    sessionStorage.setItem("cart", JSON.stringify(cart));
    renderItems();
  });
}

async function fetchCart() {
  const user = sessionStorage.getItem("user");
  const headers = {
    "x-expediente": 744661,
    "x-user": user,
  };

  const res = await fetch("https://products-dasw.onrender.com/api/cart", {
    method: "GET",
    headers,
  });

  return await res.json();
}

function render(id, html) {
  document.querySelector(`#${id}`).innerHTML = html;
}

function renderItems(cart) {
  const items = cart || JSON.parse(sessionStorage.getItem("cart")).cart;
  const html = items.map((item, i) => toCartItemComponent(item, i)).join("\n");
  render("items-container", html);
}

function toCartItemComponent(item, i) {
  const product = item.product;

  return `
      <div class="border p-3 mb-3 cart-item" style="width: 45%; height: 38vh; overflow: auto;">
        <div class="container d-flex item-container" data-productuuid="${
          product.uuid
        }">
          <div class="col media-body product-body pe-3">
            <h4>
              ${product.name}
              <button type="button" class="btn btn-danger btn-remove">
                <i class="bi bi-trash3-fill"></i>
              </button>
            </h4>
            <p>${product.description}</p>
            <form action="">
              <div class="row align-items-center g-2">
                <div class="input-group mb-3 input-group-quantity">
                  <span class="input-group-text">Quantity</span>
                  <input id="input-quantity-${
                    i + 1
                  }" class="form-control" name="input-quantity-${
    i + 1
  }" type="number" value=${item.amount} disabled />
                  <button type="button" class="btn btn-info btn-edit">
                    <i class="bi bi-pencil"></i>
                  </button>
                </div>
              </div>
              <div class="row align-items-center g-2">
                <div class="input-group mb-3">
                  <span class="input-group-text">Price</span>
                  <input type="number" class="form-control" name="input-price-${
                    i + 1
                  }" id="input-price-${i + 1}" value=${
    product.pricePerUnit
  } disabled />
                  <span class="input-group-text">MXN</span>
                </div>
              </div>
            </form>
          </div>
          <div class="col d-flex img-cart">
            <img src="${product.imageUrl}" alt="${
    product.name
  }" class="rounded-circle w-100" />
          </div>
        </div>
      </div>
    `;
}

function editQuantity(el) {
  const itemContainer = el.closest(".item-container");
  const inputGroupQuantity = itemContainer.querySelector(
    ".input-group-quantity"
  );
  const inputQuantity = inputGroupQuantity.querySelector("input");
  const btnEdit = itemContainer.querySelector(".btn-edit");

  const originalQuantity = inputQuantity.value;
  const uuid = itemContainer.dataset["productuuid"];

  btnEdit.remove();

  inputQuantity.removeAttribute("disabled");

  const btnCancel = document.createElement("button");
  btnCancel.setAttribute("type", "button");
  btnCancel.classList.add("btn", "btn-danger", "btn-cancel");
  btnCancel.innerHTML = `<i class="bi bi-x-lg"></i>`;
  inputGroupQuantity.appendChild(btnCancel);

  const btnConfirm = document.createElement("button");
  btnConfirm.setAttribute("type", "button");
  btnConfirm.classList.add("btn", "btn-success", "btn-confirm");
  btnConfirm.innerHTML = `<i class="bi bi-check-lg"></i>`;
  inputGroupQuantity.appendChild(btnConfirm);

  btnCancel.addEventListener("click", () => {
    inputQuantity.value = originalQuantity;
    btnCancel.remove();
    btnConfirm.remove();
    inputQuantity.setAttribute("disabled", true);
    inputGroupQuantity.insertAdjacentHTML(
      "beforeend",
      `
        <button type="button" class="btn btn-info btn-edit">
          <i class="bi bi-pencil"></i>
        </button>
      `
    );
  });

  btnConfirm.addEventListener("click", () => {
    const newQuantity = parseInt(inputQuantity.value);
    if (newQuantity <= 0) {
      removeItemFromCart(itemContainer);
    } else {
      updateQuantity(uuid, newQuantity);
      inputQuantity.setAttribute("disabled", true);
      btnCancel.remove();
      btnConfirm.remove();
      inputGroupQuantity.insertAdjacentHTML(
        "beforeend",
        `
          <button type="button" class="btn btn-info btn-edit">
            <i class="bi bi-pencil"></i>
          </button>
        `
      );
    }
  });
}

async function updateQuantity(uuid, quantity) {
  const headers = {
    "x-expediente": 744661,
    "x-user": sessionStorage.getItem("user"),
    "Content-Type": "application/json",
  };

  try {
    const response = await fetch(`{{host}}/api/cart/${uuid}`, {
      method: "PATCH",
      headers: headers,
      body: JSON.stringify({ amount: quantity }),
    });
    if (!response.ok) {
      throw new Error("Failed to update quantity");
    }
    const data = await response.json();
    console.log("Quantity updated successfully:", data);
    renderCart();
  } catch (error) {
    console.error("Error updating quantity:", error);
    swal("Failed to update quantity. Please try again later.", {
      icon: "error",
    });
  }
}

function removeItemFromCart(el) {
  const itemContainer = el.closest(".item-container");
  const uuid = itemContainer.dataset.productuuid;

  Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to revert this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, delete it!",
  }).then((result) => {
    if (result.isConfirmed) {
      deleteItemFromCart(uuid);
    }
  });
}

function deleteItemFromCart(uuid) {
  const headers = {
    "x-expediente": 744661,
    "x-user": sessionStorage.getItem("user"),
  };

  fetch(`https://products-dasw.onrender.com/api/cart/${uuid}`, {
    method: "DELETE",
    headers: headers,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to delete item from cart");
      }
      return response.json();
    })
    .then(() => {
      // Remove the item from the DOM
      const itemContainer = document.querySelector(
        `[data-productuuid="${uuid}"]`
      );
      if (itemContainer) {
        itemContainer.remove();
      }
      Swal.fire("Deleted!", "Your item has been deleted.", "success");
    })
    .catch((error) => {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong while deleting the item.",
      });
    });
}

const itemContainer = document.getElementById("items-container");

renderCart();

itemContainer.addEventListener("click", (e) => {
  const target = e.target;
  const targetClasses = target.classList;
  const targetParentClasses = target.parentElement.classList;

  if (
    targetClasses.contains("btn-remove") ||
    targetParentClasses.contains("btn-remove")
  ) {
    removeItemFromCart(target);
  }

  if (
    targetClasses.contains("btn-edit") ||
    targetParentClasses.contains("btn-edit")
  )
    editQuantity(target);
});
