from app import db
from flask_login import UserMixin


class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    # ensure password hash field has length of at least 256
    password_hash = db.Column(db.String(256))


class Book(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    author = db.Column(db.String(255), nullable=False)
    isbn = db.Column(db.String(20), unique=True, nullable=False)
    publication_year = db.Column(db.Integer)
    genre = db.Column(db.String(100))
    description = db.Column(db.Text)
    total_copies = db.Column(db.Integer, default=1)
    available_copies = db.Column(db.Integer, default=1)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())


class BorrowRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    book_id = db.Column(db.Integer, db.ForeignKey('book.id'), nullable=False)
    borrow_date = db.Column(db.DateTime, default=db.func.current_timestamp())
    due_date = db.Column(db.DateTime, nullable=False)
    return_date = db.Column(db.DateTime)
    status = db.Column(db.String(20), default='borrowed')  # borrowed, returned, overdue
    
    # Relationships
    user = db.relationship('User', backref=db.backref('borrow_records', lazy=True))
    book = db.relationship('Book', backref=db.backref('borrow_records', lazy=True))