import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import mongoose from 'mongoose';
import { config } from 'dotenv';
import { Category } from '../src/book/schemas/book.schema';

config(); // Load environment variables

if (!process.env.DB_URI) {
  throw new Error('DB_URI is not defined in the environment variables');
}

interface AuthResponse {
  token: string;
}

interface BookResponse {
  _id: string;
  title: string;
  description: string;
  author: string;
  price: number;
  category: Category;
}

interface DeleteResponse {
  deleted: boolean;
}

describe('Book & Auth Controller (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string = '';

  const user = {
    name: 'Ghulam',
    email: 'ghulam@gmail.com',
    password: '12345678',
  };

  const newBook = {
    title: 'New Book',
    description: 'Book Description',
    author: 'Author',
    price: 100,
    category: Category.FANTASY,
  };

  beforeAll(async () => {
    // Connect to the database
    await mongoose.connect(process.env.DB_URI as string);

    // Initialize the application
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const res = await request(app.getHttpServer())
      .post('/auth/signup')
      .send(user)
      .expect(201);

    jwtToken = (res.body as AuthResponse).token;
  });

  afterAll(async () => {
    // Disconnect from the database and close the app
    await mongoose.disconnect();
    await app.close();
  });

  beforeEach(async () => {
    // Clear the database before each test
    if (mongoose.connection && mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }
  });

  describe('Auth', () => {
    it('(POST) - Register a new user', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(user)
        .expect(201);

      expect((res.body as AuthResponse).token).toBeDefined();
    });

    it('(POST) - Login user', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: user.email, password: user.password })
        .expect(200);

      expect((res.body as AuthResponse).token).toBeDefined();
    });
  });

  describe('Books', () => {
    it('(POST) - Create new Book', async () => {
      const res = await request(app.getHttpServer())
        .post('/books')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(newBook)
        .expect(201);

      const responseBody = res.body as BookResponse;
      expect(responseBody._id).toBeDefined();
      expect(responseBody.title).toEqual(newBook.title);
    });

    it('(GET) - Get all Books', async () => {
      await request(app.getHttpServer())
        .post('/books')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(newBook)
        .expect(201);

      const res = await request(app.getHttpServer()).get('/books').expect(200);
      const books = res.body as BookResponse[];
      expect(books.length).toBeGreaterThan(0);
    });

    it('(GET) - Get a Book by ID', async () => {
      const createdBook = await request(app.getHttpServer())
        .post('/books')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(newBook)
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`/books/${(createdBook.body as BookResponse)._id}`)
        .expect(200);

      expect(res.body).toBeDefined();
      expect((res.body as BookResponse)._id).toEqual(
        (createdBook.body as BookResponse)._id,
      );
    });

    it('(PUT) - Update a Book by ID', async () => {
      const createdBook = await request(app.getHttpServer())
        .post('/books')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(newBook)
        .expect(201);

      const updatedBook = { title: 'Updated Title' };

      const res = await request(app.getHttpServer())
        .put(`/books/${(createdBook.body as BookResponse)._id}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(updatedBook)
        .expect(200);

      expect(res.body).toBeDefined();
      expect((res.body as BookResponse).title).toEqual(updatedBook.title);
    });

    it('(DELETE) - Delete a Book by ID', async () => {
      const createdBook = await request(app.getHttpServer())
        .post('/books')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send(newBook)
        .expect(201);

      const res = await request(app.getHttpServer())
        .delete(`/books/${(createdBook.body as BookResponse)._id}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(res.body).toBeDefined();
      expect((res.body as DeleteResponse).deleted).toEqual(true);
    });
  });
});
