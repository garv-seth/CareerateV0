from flask import render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from app import app, db
from models import User, Book, BorrowRecord
from datetime import datetime, timedelta


@app.route('/')
def index():
    """Home page showing library overview"""
    total_books = Book.query.count()
    available_books = Book.query.filter(Book.available_copies > 0).count()
    total_users = User.query.count()
    
    recent_books = Book.query.order_by(Book.created_at.desc()).limit(5).all()
    
    return render_template('index.html', 
                         total_books=total_books,
                         available_books=available_books,
                         total_users=total_users,
                         recent_books=recent_books)


@app.route('/books')
def books():
    """Display all books"""
    search = request.args.get('search', '')
    genre = request.args.get('genre', '')
    
    query = Book.query
    
    if search:
        query = query.filter(
            (Book.title.contains(search)) | 
            (Book.author.contains(search)) |
            (Book.isbn.contains(search))
        )
    
    if genre:
        query = query.filter(Book.genre == genre)
    
    books = query.all()
    genres = db.session.query(Book.genre).distinct().all()
    
    return render_template('books.html', 
                         books=books, 
                         genres=[g[0] for g in genres if g[0]], 
                         search=search,
                         selected_genre=genre)


@app.route('/books/<int:book_id>')
def book_detail(book_id):
    """Display book details"""
    book = Book.query.get_or_404(book_id)
    return render_template('book_detail.html', book=book)


@app.route('/login', methods=['GET', 'POST'])
def login():
    """User login"""
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        user = User.query.filter_by(username=username).first()
        
        if user and check_password_hash(user.password_hash, password):
            login_user(user)
            flash('Logged in successfully!', 'success')
            return redirect(url_for('index'))
        else:
            flash('Invalid username or password', 'error')
    
    return render_template('login.html')


@app.route('/register', methods=['GET', 'POST'])
def register():
    """User registration"""
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        
        # Check if user already exists
        if User.query.filter_by(username=username).first():
            flash('Username already exists', 'error')
            return render_template('register.html')
        
        if User.query.filter_by(email=email).first():
            flash('Email already registered', 'error')
            return render_template('register.html')
        
        # Create new user
        user = User(
            username=username,
            email=email,
            password_hash=generate_password_hash(password)
        )
        
        db.session.add(user)
        db.session.commit()
        
        flash('Registration successful! Please log in.', 'success')
        return redirect(url_for('login'))
    
    return render_template('register.html')


@app.route('/logout')
@login_required
def logout():
    """User logout"""
    logout_user()
    flash('Logged out successfully!', 'success')
    return redirect(url_for('index'))


@app.route('/borrow/<int:book_id>')
@login_required
def borrow_book(book_id):
    """Borrow a book"""
    book = Book.query.get_or_404(book_id)
    
    if book.available_copies <= 0:
        flash('Book is not available for borrowing', 'error')
        return redirect(url_for('book_detail', book_id=book_id))
    
    # Check if user already borrowed this book and hasn't returned it
    existing_borrow = BorrowRecord.query.filter_by(
        user_id=current_user.id,
        book_id=book_id,
        status='borrowed'
    ).first()
    
    if existing_borrow:
        flash('You have already borrowed this book', 'error')
        return redirect(url_for('book_detail', book_id=book_id))
    
    # Create borrow record
    borrow_record = BorrowRecord(
        user_id=current_user.id,
        book_id=book_id,
        due_date=datetime.now() + timedelta(days=14)  # 2 weeks borrowing period
    )
    
    # Update book availability
    book.available_copies -= 1
    
    db.session.add(borrow_record)
    db.session.commit()
    
    flash(f'Successfully borrowed "{book.title}"', 'success')
    return redirect(url_for('my_books'))


@app.route('/return/<int:borrow_id>')
@login_required
def return_book(borrow_id):
    """Return a borrowed book"""
    borrow_record = BorrowRecord.query.get_or_404(borrow_id)
    
    if borrow_record.user_id != current_user.id:
        flash('Unauthorized action', 'error')
        return redirect(url_for('my_books'))
    
    if borrow_record.status != 'borrowed':
        flash('Book has already been returned', 'error')
        return redirect(url_for('my_books'))
    
    # Update borrow record
    borrow_record.return_date = datetime.now()
    borrow_record.status = 'returned'
    
    # Update book availability
    book = Book.query.get(borrow_record.book_id)
    book.available_copies += 1
    
    db.session.commit()
    
    flash(f'Successfully returned "{book.title}"', 'success')
    return redirect(url_for('my_books'))


@app.route('/my-books')
@login_required
def my_books():
    """Display user's borrowed books"""
    borrowed_books = BorrowRecord.query.filter_by(
        user_id=current_user.id,
        status='borrowed'
    ).all()
    
    return render_template('my_books.html', borrowed_books=borrowed_books)