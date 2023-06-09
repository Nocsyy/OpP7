const Book = require('../models/book');
const fs = require('fs');

exports.createBook = (req, res) => {
  const bookObject = JSON.parse(req.body.book);
  delete bookObject._id;
  const book = new Book({
    ...bookObject,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename
      }`,
  });
  book
    .save()
    .then(() => res.status(201).json({ message: 'Objet enregistré !' }))
    .catch((error) => {
      console.log(error);
      return res.status(400).json({ error });
    });
};


exports.getOneBook = (req, res) => {
  Book.findOne({
    _id: req.params.id,
  })
    .then((book) => {
      res.status(200).json(book);
    })
    .catch((error) => {
      res.status(404).json({
        error,
      });
    });
};

exports.modifyBook = (req, res) => {
  const bookObject = req.file
    ? {
      ...JSON.parse(req.body.book),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename
        }`,
    }
    : { ...req.body };

  delete bookObject.userId;
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(401).json({ message: 'Not authorized' });
      } else {
        if (req.file) {
          const filename = book.imageUrl.split('/images/')[1];
          fs.unlink(`images/${filename}`, () => {
            Book.updateOne(
              { _id: req.params.id },
              { ...bookObject, _id: req.params.id }
            )
              .then(() => res.status(200).json({ message: 'Objet modifié!' }))
              .catch((error) => res.status(401).json({ error }));
          })
        } else {
          Book.updateOne(
            { _id: req.params.id },
            { ...bookObject, _id: req.params.id }
          )
            .then(() => res.status(200).json({ message: 'Objet modifié!' }))
            .catch((error) => res.status(401).json({ error }));
        }

      }
    })
    .catch((error) => {
      console.log(error);
      return res.status(400).json({ error });
    });
};

exports.deleteBook = (req, res) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(401).json({ message: 'Not authorized' });
      } else {
        const filename = book.imageUrl.split('/images/')[1];
        fs.unlink(`images/${filename}`, () => {
          Book.deleteOne({ _id: req.params.id })
            .then(() => {
              res.status(200).json({ message: 'Objet supprimé !' });
            })
            .catch((error) => res.status(401).json({ error }));
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

exports.getAllBook = (req, res) => {
  Book.find()
    .then((books) => {
      res.status(200).json(books);
    })
    .catch((error) => {
      res.status(400).json({
        error,
      });
    });
};

exports.bestrating = (req, res) => {
  Book.find()
    .then((books) => {
      books.sort((a, b) => b.averageRating - a.averageRating);
      const topBooks = books.slice(0, 3);
      res.status(200).json(topBooks);
    })
    .catch((error) => {
      res.status(400).json({
        error,
      });
    });
};



exports.rating = (req, res) => {
  const { rating, userId } = req.body;
  const bookId = req.params.id;

  Book.findOneAndUpdate(
    { _id: bookId },
    { $push: { ratings: { grade: rating, userId } } },
    { new: true } //new doc maj
  )
    .then((updatedBook) => {
      const grades = updatedBook.ratings.map((rating) => rating.grade);
      const sumGrades = grades.reduce((total, grade) => total + grade, 0);
      updatedBook.averageRating = sumGrades / updatedBook.ratings.length;

      return updatedBook.save();
    })
    .then((bookWithAverageRating) => {
      res.status(200).json(bookWithAverageRating);
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};



