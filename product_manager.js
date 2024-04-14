document.addEventListener("DOMContentLoaded", function () {
  fetchProducts();
  document
    .getElementById("filterBtn")
    .addEventListener("click", filterProducts);
  document
    .getElementById("addProductForm")
    .addEventListener("submit", addProduct);
});

function fetchProducts() {
  fetch("https://products-dasw.onrender.com/api/products", {
    method: "GET",
    headers: { "x-expediente": 744661, "x-auth": "admin" },
  })
    .then((response) => response.json())
    .then((products) => {
      populateProductsTable(products);
      populateCategoriesDropdown(products);
    })
    .catch((error) => console.error("Error fetching products:", error));
}

function populateProductsTable(products) {
  const tableBody = document.getElementById("productsTableBody");
  tableBody.innerHTML = "";

  products.forEach((product) => {
    const row = `
        <tr>
          <td>${product.name}</td>
          <td>${product.description}</td>
          <td>${product.pricePerUnit}</td>
          <td>${product.stock}</td>
          <td>${product.category}</td>
          <td>
          <button class="btn btn-sm btn-primary btn-edit" data-uuid="${product.uuid}">Edit</button>
          <button class="btn btn-sm btn-danger btn-delete" data-uuid="${product.uuid}">Delete</button>
          </td>
        </tr>
      `;
    tableBody.innerHTML += row;
  });
}

function populateCategoriesDropdown(products) {
  const categoryFilter = document.getElementById("categoryFilter");
  const categories = new Set(products.map((product) => product.category));
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.textContent = category;
    option.value = category;
    categoryFilter.appendChild(option);
  });
}

function filterProducts() {
  const category = document.getElementById("categoryFilter").value;
  const products = JSON.parse(sessionStorage.getItem("products"));

  const minPrice = parseFloat(document.getElementById("minPrice").value);
  const maxPrice = parseFloat(document.getElementById("maxPrice").value);

  const filteredProducts = products
    .filter((product) => {
      const price = parseFloat(product.pricePerUnit);
      return !category || product.category === category;
    })
    .filter((product) => {
      const price = parseFloat(product.pricePerUnit);
      return (
        (!minPrice || price >= minPrice) && (!maxPrice || price <= maxPrice)
      );
    });

  populateProductsTable(filteredProducts);

  fetch("https://products-dasw.onrender.com/api/products", {
    method: "GET",
    headers: { "x-expediente": 744661, "x-auth": "admin" },
  })
    .then((response) => response.json())
    .then((products) => {
      sessionStorage.setItem("products", JSON.stringify(products));
    })
    .catch((error) => console.error("Error re-fetching products:", error));
}

document
  .getElementById("addProductForm")
  .addEventListener("submit", addProduct);

function addProduct(event) {
  event.preventDefault();

  const formData = {
    name: document.getElementById("productName").value,
    description: document.getElementById("productDescription").value,
    pricePerUnit: parseFloat(document.getElementById("productPrice").value),
    stock: parseInt(document.getElementById("productStock").value),
    category: document.getElementById("productCategory").value,
    imageUrl: document.getElementById("productImageUrl").value,
    unit: document.getElementById("productUnit").value,
  };

  fetch("https://products-dasw.onrender.com/api/products", {
    method: "POST",
    headers: {
      "x-expediente": 744661,
      "x-auth": "admin",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to add product");
      }
      return response.json();
    })
    .then((data) => {
      Swal.fire({
        icon: "success",
        title: "Product Added",
        text: "The product has been added successfully!",
        timer: 1500,
        showConfirmButton: false,
      });

      document.getElementById("addProductForm").reset();

      const modalElement = document.getElementById("addProductModal");
      const modal = bootstrap.Modal.getInstance(modalElement);
      modal.hide();

      fetchProducts();
    })
    .catch((error) => {
      console.error("Error adding product:", error);
      Swal.fire({
        icon: "error",
        title: "Failed to Add Product",
        text: "An error occurred while adding the product.",
      });
    });
}

document
  .getElementById("editProductForm")
  .addEventListener("submit", editProduct);

document.addEventListener("click", function (event) {
  if (event.target.classList.contains("btn-edit")) {
    const uuid = event.target.dataset.uuid;
    editProduct(uuid);
  } else if (event.target.classList.contains("btn-delete")) {
    const uuid = event.target.dataset.uuid;
    deleteProductConfirmation(uuid);
  }
});

function editProduct(uuid) {
  fetch(`https://products-dasw.onrender.com/api/products/${uuid}`, {
    method: "GET",
    headers: {
      "x-expediente": "744661",
      "x-auth": "admin",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch product for editing");
      }
      return response.json();
    })
    .then((product) => {
      document.getElementById("editProductUuid").value = product.uuid;
      document.getElementById("editProductName").value = product.name;
      document.getElementById("editProductDescription").value =
        product.description;
      document.getElementById("editProductPrice").value = product.pricePerUnit;
      document.getElementById("editProductStock").value = product.stock;
      document.getElementById("editProductCategory").value = product.category;
      document.getElementById("editProductImageUrl").value = product.imageUrl;
      document.getElementById("editProductUnit").value = product.unit;

      const modal = new bootstrap.Modal(
        document.getElementById("editProductModal")
      );
      modal.show();
    })
    .catch((error) => {
      console.error("Error fetching product for editing:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch product details for editing.",
      });
    });
}

document
  .getElementById("editProductForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const formData = {
      uuid: document.getElementById("editProductUuid").value,
      name: document.getElementById("editProductName").value,
      description: document.getElementById("editProductDescription").value,
      pricePerUnit: parseFloat(
        document.getElementById("editProductPrice").value
      ),
      stock: parseInt(document.getElementById("editProductStock").value),
      category: document.getElementById("editProductCategory").value,
      imageUrl: document.getElementById("editProductImageUrl").value,
      unit: document.getElementById("editProductUnit").value,
    };

    fetch(`https://products-dasw.onrender.com/api/products/${formData.uuid}`, {
      method: "PUT",
      headers: {
        "x-expediente": "744661",
        "x-auth": "admin",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to edit product");
        }
        return response.json();
      })
      .then((data) => {
        Swal.fire({
          icon: "success",
          title: "Product Edited",
          text: "The product has been edited successfully!",
          timer: 1500,
          showConfirmButton: false,
        });

        const modal = new bootstrap.Modal(
          document.getElementById("editProductModal")
        );
        modal.hide();

        fetchProducts();
      })
      .catch((error) => {
        console.error("Error editing product:", error);
        Swal.fire({
          icon: "error",
          title: "Failed to Edit Product",
          text: "An error occurred while editing the product.",
        });
      });
  });

function deleteProductConfirmation(uuid) {
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
      deleteProduct(uuid);
    }
  });
}

function deleteProduct(productId) {
  fetch(`https://products-dasw.onrender.com/api/products/${productId}`, {
    method: "DELETE",
    headers: {
      "x-expediente": 744661,
      "x-auth": "admin",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to delete product");
      }
      return response.json();
    })
    .then((data) => {
      Swal.fire({
        icon: "success",
        title: "Product Deleted",
        text: "The product has been deleted successfully!",
      });
      fetchProducts();
    })
    .catch((error) => {
      console.error("Error deleting product:", error);
      Swal.fire({
        icon: "error",
        title: "Failed to Delete Product",
        text: "An error occurred while deleting the product.",
      });
    });
}
