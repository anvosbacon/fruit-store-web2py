def get_logged_in_user():
    user = None if auth.user is None else auth.user.email
    return response.json(dict(user=user))

def get_all_products():
    products = db(db.product).select()
    for p in products:
        sum = 0
        reviews = db((db.review.product_id == p.id) & (db.review.rating > 0)).select()
        for r in reviews:
            sum += r.rating

        if (len(reviews) > 0):
            p.avg = sum / len(reviews)
        else:
            p.avg = 0

    return response.json(dict(products=products))

@auth.requires_login()
def get_your_review():
    review = db((db.review.product_id == request.vars.product_id) & (db.review.email == request.vars.email)).select().first()
    return response.json(dict(review=review))

@auth.requires_login()
def save_review():
    print(request.vars.product_id)
    print(request.vars.email)
    db.review.update_or_insert(
        ((db.review.product_id == request.vars.product_id) & (db.review.email == request.vars.email)),
        body=request.vars.body,
        product_id=request.vars.product_id
    )
    return "ok"

def get_other_reviews():
    if auth.user is None:
        other_reviews = db(db.review.product_id == request.vars.product_id).select()
    else:
        other_reviews = db( (db.review.product_id == request.vars.product_id) & (db.review.email != auth.user.email) ).select()
    
    return response.json(dict(other_reviews=other_reviews))

@auth.requires_login()
def update_star():
    db.review.update_or_insert(
        ((db.review.product_id == request.vars.product_id) & (db.review.email == request.vars.email)),
        rating=request.vars.rating,
        product_id=request.vars.product_id
    )
    return "ok"

def search():
    products = db(db.product).select()
    print(products)
    search_string = request.vars.search_string or ''
    print(search_string)
    result = []
    for product in products:
        print(product)
        print(product.name.lower())
        # if search_string.lower() in product.name.lower():
        if product.name.lower().startswith(search_string.lower()):
            result.append(product)

    print(result)

    for p in result:
        sum = 0
        reviews = db((db.review.product_id == p.id) & (db.review.rating > 0)).select()
        for r in reviews:
            sum += r.rating

        if (len(reviews) > 0):
            p.avg = sum / len(reviews)
        else:
            p.avg = 0

    return response.json(dict(result=result))

def get_shopping_cart():
    user_cart = db(db.shopping_cart.email == request.vars.email).select()
    # # For testing
    # print(user_cart)
    return response.json(dict(user_cart=user_cart))

def buy():
    db.shopping_cart.update_or_insert(
        ((db.shopping_cart.product_id == request.vars.product_id) & (db.shopping_cart.email == request.vars.email)),
        product_id=request.vars.product_id,
        email=request.vars.email,
        quantity=request.vars.quantity
    )

def clear_cart():
    clear = db(db.shopping_cart.email == request.vars.email).delete()
    return response.json(dict(clear=clear))