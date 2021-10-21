def get_user_email():
    return None if auth.user is None else auth.user.email

def get_name():
    return None if auth.user is None else auth.user.first_name + ' ' + auth.user.last_name

db.define_table('product',
    Field('name', default=''),
    Field('description', type='text', default=''),
    Field('price', type='double'),
    Field('buy_amount', type='integer')
)

db.define_table('review',
    Field('product_id', type='reference product'),
    Field('rating', type='integer', default=0),
    Field('email', default=get_user_email()),
    Field('body', type='text', default=''),
    Field('name', default=get_name())
)

db.define_table('shopping_cart',
    Field('product_id', type='reference product'),
    Field('email', default=get_user_email()),
    Field('quantity', type='integer')
)

# currency formatting
db.product.price.represent = lambda price, row : '${:,.2f}'.format(price)
