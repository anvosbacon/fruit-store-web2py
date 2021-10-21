Vue.component('modal', {
    template: '#modal-template'
})

// Adds fields to app.products
let processProducts = function() {
    let index = 0;
    app.products.map((product) => {
        Vue.set(product, 'index', index++);
        Vue.set(product, 'showReviews', false);
        Vue.set(product, 'otherReviews', []);
        Vue.set(product, 'yourReview', { body: '', rating: 0, numStars: 0 });
        Vue.set(product, 'buyAmount', 0);
    });
};

// Pulls products from database
let getAllProducts = function() {
    $.getJSON(getAllProductsUrl, function(response) {
        app.products = response.products;
        processProducts();

        // // For testing
        // console.log("Website loaded. Initial product list:")
        // console.table(app.products);
        getCart();
    });
};

// Sets app.loggedInUser to auth.user.email
let getLoggedInUser = function(callback) {
    $.getJSON(getLoggedInUserUrl, function(response) {
        app.loggedInUser = response.user;
        callback();
    });
};

// Function to run first
let onPageLoad = function() {
    getLoggedInUser(function() { getAllProducts();} );
};

// Populates app.products[productIndex].yourReview
let getYourReview = function(productIndex) {
    if (app.loggedInUser == undefined) {
        return;
    }

    let product = app.products[productIndex];

    $.getJSON(getYourReviewUrl, { product_id: product.id, email: app.loggedInUser }, function(response) {
        if (response.review != null) {
            product.yourReview.body = response.review.body;
            product.yourReview.rating = response.review.rating;
            product.yourReview.numStars = response.review.rating;
        }
        Vue.set(product.yourReview, 'hasBeenSaved', false);
    });
};

// Populates app.products[productIndex].otherReviews
let getOtherReviews = function(productIndex) {
    let product = app.products[productIndex];
    $.getJSON(getOtherReviewsUrl, { product_id: product.id }, function(response) {
        product.otherReviews = response.other_reviews;
    });
};

// Opens/closes review section
let toggleReviewsSection = function(productIndex) {
    let product = app.products[productIndex];
    product.showReviews = !product.showReviews;

    // Close all other reviews
    for (let i = 0; i < app.products.length; i++) {
        if (i != productIndex) {
            app.products[i].showReviews = false;
        }
    }
};

// Save review to database
let saveReview = function(productIndex) {
    if (app.loggedInUser == undefined) {
        return;
    }

    let product = app.products[productIndex];
    let yourReview = product.yourReview;
    yourReview.hasBeenSaved = false;

    $.post(saveReviewUrl, {
        product_id: product.id,
        email: app.loggedInUser,
        body: yourReview.body
    }, 
    // Show checkmark and hide after 1000ms
    function(response) {
        yourReview.hasBeenSaved = true;
        setTimeout(function() {
            yourReview.hasBeenSaved = false;
        }, 1000);
    });
};

// Show star change on mouseover
let hoverStar = function(productIndex, starNum) {
    let product = app.products[productIndex];
    product.yourReview.numStars = starNum;
};

// Reset stars after leaving hoverstar
let leaveStarRow = function(productIndex) {
    let product = app.products[productIndex];
    product.yourReview.numStars = product.yourReview.rating;
};

// Save star rating and recalculate average star rating
let clickStar = function(productIndex, starNum) {
    let product = app.products[productIndex];
    product.yourReview.rating = starNum;
    $.post(updateStarUrl, {
        product_id: product.id,
        email: app.loggedInUser,
        rating: starNum
    }, function() {

    });
    
    // Update average star rating
    let sumRe = 0;
    let length = product.otherReviews.length + 1;
    if (product.yourReview.rating > 0) {
        sumRe += product.yourReview.rating;
    } else {
        length--;
    }
    for(let i = 0; i < product.otherReviews.length; i++){
        if (product.otherReviews[i].rating > 0) {
            sumRe +=  product.otherReviews[i].rating;
        } else {
            length--;
        }
    }
    product.avg = sumRe/length;
};

// Search for strings starting with search_string
let doSearch = function() {
    $.getJSON(searchUrl, { search_string: app.search_string }, function(data) {
        app.products = data.result;
        processProducts();
    });
};

let buy = function(productIndex, buyAmount) {
    let product = app.products[productIndex];
    let cart = app.cart;

    // For testing
    console.log("Starting buy function...")
    console.log("product:")
    console.log(product)
    console.log("cart:")
    console.table(cart)

    let already_present = false;
    let found_index = 0;

    // // For testing
    // console.log("testing...");
    // console.log(productIndex);
    // console.log(buyAmount);

    // Look for product in cart
    for (i = 0; i < cart.length; i++) {
        if (cart[i].id == product.id) {
            already_present = true;
            found_index = i;
        }
    }

    if (!already_present) {
        found_index = cart.length;
        cart.push(product);
        app.cart_total += (cart[found_index].price * buyAmount);
    }
    else {
        app.cart_total += (cart[found_index].price * buyAmount);
        buyAmount += cart[found_index].quantity;
    }
    Vue.set(cart[found_index], 'quantity', buyAmount);


    $.post(buyUrl, {
        product_id: product.id,
        email: app.loggedInUser,
        quantity: buyAmount
    }, function() {});

    // let already_present = false;
    // let found_index = 0;
    // for (let i = 0; i < cart.length; i++) {
    //     if (cart[i].id == product.id) {
    //         already_present = true;
    //         found_index = i;
    //     }
    // }

    // if (!already_present) {
    //     cart.push(product);
    // }

    product.buyAmount = 0;
};


// Executes inside getAllProducts()
let getCart = function() {
    let products = app.products;
    let cart = app.cart;

    // // For testing
    // console.log("products:");
    // console.table(products);
    // console.log("cart:");
    // console.table(cart);

    // Pull shopping cart from database
    $.getJSON(getShoppingCartUrl, {email: app.loggedInUser}, function(response) {
        user_cart = response.user_cart;

        // // For testing
        // console.log("user_cart");
        // console.table(user_cart);

        // Populate cart array
        for (i = 0; i < user_cart.length; i++) {
            let price = 0;
            for (j = 0; j < products.length; j++) {
                if (products[j].id == user_cart[i].product_id) {
                    cart.push(products[j]);
                    Vue.set(cart[i], 'quantity', user_cart[i].quantity);
                    price = products[j].price;
                }
            }
            app.cart_total += (user_cart[i].quantity * price);
        }
    });
};

let clearCart = function() {
    console.log("clearCart initialized.")
    app.total_display = app.cart_total;
    app.cart_total = 0;
    app.cart = [];

    $.getJSON(clearCartUrl, {email: app.loggedInUser}, function(response) {});
};

// Define Vue app
let app = new Vue({
    el: "#app",
    delimiters: ['${', '}'],
    unsafeDelimiters: ['!{', '}'],
    data: {
        page: 'store',
        products: [],
        cart: [],
        starIndices: [1, 2, 3, 4, 5],
        loggedInUser: undefined,
        search_string: '',
        cart_total: 0,
        total_display: 0,
        showModal: false
    },
    methods: {
        getYourReview: getYourReview,
        toggleReviewsSection: toggleReviewsSection,
        hoverStar: hoverStar,
        leaveStarRow: leaveStarRow,
        clickStar: clickStar,
        doSearch: doSearch,
        getCart: getCart,
        buy: buy,
        clearCart: clearCart
    }
});

// Do this first
onPageLoad();
